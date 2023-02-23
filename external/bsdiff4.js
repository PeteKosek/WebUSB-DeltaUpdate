import { do_diff, do_patch } from "./bsdiff4util";

let MAGIC = BSDIFF40; //8bytes

function human_bytes(n) {
  //return the number of bytes 'n' in more human readable form
  if (n < 1024) return "%i B" % n;
  k = (n - 1) / 1024 + 1;
  if (k < 1024) return "%i KB" % k;
  return "%.2f MB" % (float(n) / 2 ** 20);
}

//write a BSDIFF4-format patch to an array bufferobj
function write_patch(obj, len_dst, controlArrays, bdiff, bextra) {
  let patch_view = new Uint8Array(obj.f_patch);

  let AsBytes = new TextEncoder(); //Encode in utf-8 format
  const magic = AsBytes.encode(MAGIC);
  patch_view.set(magic, 0); //write patch magic, end offset is 8

  // write control tuples as series of offts
  for (c in controlArrays) {
    //start from offest 8?
    for (x in c) {
      faux.write(core.encode_int64(x));
    }
  }
  //compress each block, clone bzip2 js repo
  bcontrol = bz2.compress(faux.getvalue());
  bdiff = bz2.compress(bdiff);
  bextra = bz2.compress(bextra);
  for (n in (len(bcontrol), len(bdiff), len_dst)) {
    fo.write(core.encode_int64(n));
  }
  fo.write(bcontrol);
  fo.write(bdiff);
  fo.write(bextra);
}

//read a BSDIFF4-format patch from stream 'fi'
//read a BSDIFF4 patch from ArrayBuffer object
function read_patch(f_patch) {
  try {
    const magic = new Uint8Array(f_patch, 0, 8);
    let AsNumber = new TextDecoder();
    if (AsNumber.decode(magic) != MAGIC) {
      throw new Error("Bad patch magic");
    }
    let patch_view = new Uint8Array(f_patch);
    // length headers
    len_control = core.decode_int64(fi.read(8));
    len_diff = core.decode_int64(fi.read(8));
    len_dst = core.decode_int64(fi.read(8));
    // read the control header
    bcontrol = bz2.decompress(fi.read(len_control));
    // tcontrol = [(core.decode_int64(bcontrol[i:i + 8]),
    //              core.decode_int64(bcontrol[i + 8:i + 16]),
    //              core.decode_int64(bcontrol[i + 16:i + 24]))
    //             for i in range(0, len(bcontrol), 24)]

    // read the diff and extra blocks
    bdiff = bz2.decompress(fi.read(len_diff));
    bextra = bz2.decompress(fi.read());
    return len_dst, tcontrol, bdiff, bextra;
  } catch (Error) {
    console.error(Error);
  }
}
//Return a BSDIFF4-format patch (from src_bytes to dst_bytes) as ArrayBuffer.
function diff({ arrBuff_src, arrBuff_dst } = {}) {
  //f_patch = new ArrayBuffer(arrBuff_dst.byteLength);
  let obj_to_save_patch = {
    //to pass by ref
    f_patch: new ArrayBuffer(arrBuff_dst.byteLength),
  };

  write_patch(
    obj_to_save_patch,
    arrBuff_dst.byteLength,
    do_diff(arrBuff_src, arrBuff_dst)
  );
  return f_patch;
}

//Apply the BSDIFF4-format patch_bytes to src_bytes and return the bytes as ArrayBuffer.
function patch({ arrBuff_src, arrBuff_patch } = {}) {
  return do_patch(arrBuff_src, read_patch(arrBuff_patch));
}
