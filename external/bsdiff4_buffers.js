import { do_diff, do_patch } from "./bsdiff4util_buffers";
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
  patch,
  len_dst,
  controlArrays,
  bdiff,
  bextra,
} = {}) {
  try {
    console.log("writing patch");
    patch.write(MAGIC, 0, 8); //write patch magic, end offset is 8

    // write control arrays
    const control_view = Buffer.from(controlArrays);
    //compress each block, compressFile returns array
    const bcontrol = SnappyJS.compress(control_view);
    bdiff = SnappyJS.compress(bdiff);
    bextra = SnappyJS.compress(bextra);

    //write lengths of control header data
    patch.write(bcontrol.length, 8); //not sure about the n of bytes to write
    patch.write(bdiff.length, 16);
    patch.write(bextra.length, 24);
    patch.write(len_dst, 32);

    const write = [bcontrol, bdiff, bextra];
    patch.write(write, 40);
  } catch (Error) {
    console.error(Error);
  }
}

///////////////////////////////////////////////////////////////////
//
// A function that reads a BSDIFF4 patch from ArrayBuffer object
//
///////////////////////////////////////////////////////////////////
function read_patch(patch) {
  try {
    //magic check
    const magic = patch.toString("utf8", 0, 8); //read and decode magic
    if (magic != MAGIC) {
      throw new Error("Bad patch magic");
    }
    let tcontrol;

    // length headers
    const len_control = patch.toString("utf8", 8, 16);
    const len_diff = patch.toString("utf8", 16, 24);
    const len_extra = patch.toString("utf8", 24, 32);
    const len_dst = patch.toString("utf8", 32, 40);

    // read the control header
    const bcontrol = SnappyJS.uncompress(patch.subarray(40, len_control));

    // Python slice notation -> Javascript slice method
    // a[start:stop:step]    -> a[slice(start, stop, step)]  !!!!!
    for (i in range(0, bcontrol.length, 24)) {
      tcontrol = [
        bcontrol.toString("utf8", i, i + 8),
        bcontrol.toString("utf8", i + 8, i + 16),
        bcontrol.toString("utf8", i + 16, i + 24),
      ];
    }

    // read the diff and extra blocks
    const bdiff = SnappyJS.uncompress(patch.subarray(len_control, len_diff));
    const bextra = SnappyJS.uncompress(patch.subarray(len_diff, len_extra));

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
export async function diff({ oldD, oldLength, newD, newLength } = {}) {
  try {
    console.log(oldD);
    console.log(oldLength);
    do_diff({
      oldData: oldD,
      oldDataLength: oldLength,
      newData: newD,
      newDataLength: newLength,
    }).then((delta) => {
      if (delta == -1) throw new Error(" Diffing error");
      let newPatch = Buffer.alloc(newLength);
      write_patch({
        patch: newPatch,
        patchLength: newLength,
        controlArrays: delta[0],
        bdiff: delta[1],
        bextra: delta[2],
      }).then(() => {
        return newPatch;
      });
    });
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
export async function patch(oldD, patchD) {
  return do_patch(oldD, read_patch(patchD));
}
