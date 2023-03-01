import { do_diff, do_patch } from "./bsdiff4util";
//import bz2 from "./bzip2/compressjs/lib/Bzip2";
const MAGIC = "BSDIFF40"; //8bytes
var SnappyJS = require("snappyjs");

///////////////////////////////////////////////////////////////////

// A helper function that simply converts a number of bytes and
// returns it in more readable format such as KB or MB.
//
///////////////////////////////////////////////////////////////////
function human_bytes(n) {
  //return the number of bytes 'n' in more human readable form
  if (n < 1024) return "%i B" % n;
  k = (n - 1) / 1024 + 1;
  if (k < 1024) return "%i KB" % k;
  return "%.2f MB" % (float(n) / 2 ** 20);
}

///////////////////////////////////////////////////////////////////
//
// A function that writes a BSDIFF4-format patch to ArrayBuffer obj
//
///////////////////////////////////////////////////////////////////
async function write_patch({
  obj,
  len_dst,
  controlArrays,
  bdiff,
  bextra,
} = {}) {
  try {
    console.log("writing patch");
    let patch_view = new Uint8Array(obj.f_patch);
    let AsBytes = new TextEncoder(); //Encode in utf-8 format
    const magic = AsBytes.encode(MAGIC);
    patch_view.set(magic, 0); //write patch magic, end offset is 8

    // write control arrays
    const control_view = new Uint8Array(controlArrays);
    //compress each block, compressFile returns array
    // var compressjs = require("compressjs");
    // var algorithm = compressjs.Bzip2;
    //const bcontrol = algorithm.compressFile(control_view);
    const bcontrol = SnappyJS.compress(control_view);
    bdiff = SnappyJS.compress(bdiff);
    bextra = SnappyJS.compress(bextra);

    //write lengths of control header data
    patch_view.set(AsBytes.encode(bcontrol.length), 8);
    patch_view.set(AsBytes.encode(bdiff.length), 16);
    patch_view.set(AsBytes.encode(bextra.length), 24);
    patch_view.set(AsBytes.encode(len_dst), 32);

    const write = [bcontrol, bdiff, bextra];
    patch_view.set(write, 40);
  } catch (Error) {
    console.error(Error);
  }
}

///////////////////////////////////////////////////////////////////
//
// A function that reads a BSDIFF4 patch from ArrayBuffer object
//
///////////////////////////////////////////////////////////////////
function read_patch(f_patch) {
  try {
    //magic check
    const magic = new Uint8Array(f_patch, 0, 8);
    let AsNumber = new TextDecoder();
    if (AsNumber.decode(magic) != MAGIC) {
      throw new Error("Bad patch magic");
    }
    let patch_view = new Uint8Array(f_patch);
    let tcontrol;

    // length headers
    const len_control = AsNumber.decode(patch_view.slice(8, 16));
    const len_diff = AsNumber.decode(patch_view.slice(16, 24));
    const len_extra = AsNumber.decode(patch_view.slice(24, 32));
    const len_dst = AsNumber.decode(patch_view.slice(32, 40));

    // read the control header
    const bcontrol = SnappyJS.uncompress(patch_view.slice(40, len_control));

    // Python slice notation -> Javascript slice method
    // a[start:stop:step]    -> a[slice(start, stop, step)]  !!!!!
    for (i in range(0, bcontrol.length, 24)) {
      tcontrol = [
        AsNumber.decode(bcontrol.slice(i, i + 8)),
        AsNumber.decode(bcontrol.slice(i + 8, i + 16)),
        AsNumber.decode(bcontrol.slice(i + 16, i + 24)),
      ];
    }

    // read the diff and extra blocks
    const bdiff = SnappyJS.uncompress(patch_view.slice(len_control, len_diff));
    const bextra = SnappyJS.uncompress(patch_view.slice(len_diff, len_extra));

    return len_dst, tcontrol, bdiff, bextra;
  } catch (Error) {
    console.error(Error);
  }
}

///////////////////////////////////////////////////////////////////
//
// A function that returns a BSDIFF4-format patch
// (from src_bytes to dst_bytes) as ArrayBuffer.
//
///////////////////////////////////////////////////////////////////
export async function diff({
  arrBuff_old,
  old_length,
  arrBuff_new,
  new_length,
} = {}) {
  try {
    let obj_to_save_patch = {
      f_patch: new ArrayBuffer(new_length), //to pass by ref
    };
    const diffed = await do_diff({
      oldData: arrBuff_old,
      oldDataLength: old_length,
      newData: arrBuff_new,
      newDataLength: new_length,
    });
    if (diffed == -1) {
      throw new Error(" Diffing error");
    }
    write_patch({
      obj: obj_to_save_patch,
      len_dst: new_length,
      controlArrays: diffed[0],
      bdiff: diffed[1],
      bextra: diffed[2],
    });
    return obj_to_save_patch.f_patch;
  } catch (Error) {
    console.error(Error);
    return -1;
  }
}

///////////////////////////////////////////////////////////////////
//
// A function that applies the BSDIFF4-format
// (patch_bytes to src_bytes) and returns the bytes as ArrayBuffer.
//
///////////////////////////////////////////////////////////////////
export async function patch({ arrBuff_src, arrBuff_patch } = {}) {
  return do_patch(arrBuff_src, read_patch(arrBuff_patch));
}
