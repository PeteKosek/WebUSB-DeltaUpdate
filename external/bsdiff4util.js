///////////////////////////////////////////////////////////////////
//
// A function for copying contents of source ArrayBuffer.
// Returns new ArrayBuffer with conents of the source.
//
// Author: Gleno
// Date: Mar 1, 2014
// URL: https://stackoverflow.com/questions/10100798/whats-the-most-straightforward-way-to-copy-an-arraybuffer-object
///////////////////////////////////////////////////////////////////
function copy(src) {
  try {
    if (!ArrayBuffer.isView(src)) {
      throw new Error("Expected typed array type of src parameter");
    }
    var dst = new ArrayBuffer(src.byteLength);
    new Uint8Array(dst).set(new Uint8Array(src));
    return dst;
  } catch (Error) {
    console.error(Error);
  }
}

///////////////////////////////////////////////////////////////////
//
// An adaptation of C standard library function memcpy.
// Takes uint8array typed arrays as arguments and
//
///////////////////////////////////////////////////////////////////
function memcpy({ src, dst, length } = {}) {
  try {
    if (!ArrayBuffer.isView(src)) {
      throw new Error("Expected typed array type of src parameter");
    }
    if (!ArrayBuffer.isView(dst)) {
      throw new Error("Expected typed array type of dst parameter");
    }
    if (src.byteLength != dst.byteLength) {
      throw new Error("Expected src and dst to be of equal size");
    }
    let i;
    //copy byte by byte
    for (i = 0; i < length; i++) {
      dst[i] = src[i];
    }
    return dst;
  } catch (Error) {
    console.error(Error);
  }
}

///////////////////////////////////////////////////////////////////
//
// A recursive function used in the sorting function. Splits
// src and dst data accroding to given index and length.
//
///////////////////////////////////////////////////////////////////
function split(obj) {
  var i, j, k, x, tmp, jj, kk;
  if (obj.len < 16) {
    for (k = obj.start; k < obj.start + obj.len; k += j) {
      j = 1;
      x = obj.V[obj.I[k] + h];
      for (i = 1; k + i < obj.start + obj.len; i++) {
        if (obj.V[obj.I[k + i] + obj.h] < x) {
          x = obj.V[obj.I[k + i] + obj.h];
          j = 0;
        }
        if (obj.V[obj.I[k + i] + obj.h] == x) {
          tmp = obj.I[k + j];
          obj.I[k + j] = obj.I[k + i];
          obj.I[k + i] = tmp;
          j++;
        }
      }
      for (i = 0; i < j; i++) obj.V[obj.I[k + i]] = k + j - 1;
      if (j == 1) obj.I[k] = -1;
    }
  } else {
    jj = 0;
    kk = 0;
    x = obj.V[obj.I[obj.start + obj.len / 2] + obj.h];
    for (i = obj.start; i < obj.start + obj.len; i++) {
      if (obj.V[obj.I[i] + obj.h] < x) jj++;
      if (obj.V[obj.I[i] + obj.h] == x) kk++;
    }
    jj += obj.start;
    kk += jj;
    j = 0;
    k = 0;
    i = obj.start;
    while (i < jj) {
      if (obj.V[obj.I[i] + obj.h] < x) {
        i++;
      } else if (obj.V[obj.I[i] + obj.h] == x) {
        tmp = obj.I[i];
        obj.I[i] = obj.I[jj + j];
        obj.I[jj + j] = tmp;
        j++;
      } else {
        tmp = obj.I[i];
        obj.I[i] = obj.I[kk + k];
        obj.I[kk + k] = tmp;
        k++;
      }
    }
    while (jj + j < kk) {
      if (obj.V[obj.I[jj + j] + obj.h] == x) {
        j++;
      } else {
        tmp = obj.I[jj + j];
        obj.I[jj + j] = obj.I[kk + k];
        obj.I[kk + k] = tmp;
        k++;
      }
    }
    if (jj > obj.start) {
      obj.len = jj - start;
      split(obj);
    }
    for (i = 0; i < kk - jj; i++) {
      obj.V[obj.I[jj + i]] = kk - 1;
    }
    if (jj == kk - 1) obj.I[jj] = -1;
    if (obj.start + obj.len > kk) {
      obj.len = obj.start + obj.len - kk;
      obj.start = kk;
      split(obj);
    }
  }
}

///////////////////////////////////////////////////////////////////
//
// A sorting function.
//
///////////////////////////////////////////////////////////////////
function qsufsort(obj) {
  var buckets = [256],
    i,
    h,
    len;

  for (i = 0; i < 256; i++) {
    buckets[i] = 0;
  }
  for (i = 0; i < obj.oldsize; i++) {
    buckets[obj.old[i]]++;
  }
  for (i = 1; i < 256; i++) {
    buckets[i] += buckets[i - 1];
  }
  for (i = 255; i > 0; i--) {
    buckets[i] = buckets[i - 1];
  }
  buckets[0] = 0;

  for (i = 0; i < obj.oldsize; i++) {
    obj.I[++buckets[obj.old[i]]] = i;
    obj.I[0] = obj.oldsize;
  }
  for (i = 0; i < obj.oldsize; i++) {
    obj.V[i] = buckets[obj.old[i]];
    obj.V[obj.oldsize] = 0;
  }
  for (i = 1; i < 256; i++) {
    if (buckets[i] == buckets[i - 1] + 1) obj.I[buckets[i]] = -1;
  }

  obj.I[0] = -1;
  for (h = 1; obj.I[0] != -(obj.oldsize + 1); h += h) {
    len = 0;
    for (i = 0; i < obj.oldsize + 1; ) {
      if (obj.I[i] < 0) {
        len -= obj.I[i];
        i -= obj.I[i];
      } else {
        if (len) obj.I[i - len] = -len;
        len = obj.V[obj.I[i]] + 1 - i;

        let obj_to_split = {
          I: obj.I,
          V: obj.V,
          start: i,
          len: len,
          h: h,
        };
        split(obj_to_split);
        i += len;
        len = 0;
      }
    }
    if (len) obj.I[i - len] = -len;
  }

  for (i = 0; i < oldsize + 1; i++) {
    obj.I[obj.V[i]] = i;
  }
}

///////////////////////////////////////////////////////////////////
//
// A function for checking the biggest common length of two arrays.
//
///////////////////////////////////////////////////////////////////
function matchlen(old, oldsize, neww, newsize) {
  for (var i = 0; i < oldsize && i < newsize; i++) {
    if (old[i] != neww[i]) {
      break;
    }
  }
  return i;
}

///////////////////////////////////////////////////////////////////
//
// A function that performs a search...
//
// not sure if it should be returning itself
//
///////////////////////////////////////////////////////////////////
function search(obj) {
  let x, y;
  //consider using a Typed array to store and manipulate raw binary values
  if (obj.en - obj.st < 2) {
    x = matchlen(
      obj.old + obj.I[obj.st],
      obj.oldSize - obj.I[obj.st],
      obj.neww,
      obj.newSize
    );
    y = matchlen(
      obj.old + obj.I[obj.en],
      obj.oldSize - obj.I[obj.en],
      obj.neww,
      obj.newSize
    );
    if (x > y) {
      obj.pos = obj.I[obj.st];
      return x;
    } else {
      obj.pos = obj.I[obj.en];
      return y;
    }
  }
  x = obj.st + (obj.en - obj.st) / 2;
  //if first differing byte in lhs is less than in rhs
  if (memcmp(old + I[x], neww, Math.min(oldSize - I[x], newSize)) < 0) {
    //if() {
    return search(
      obj.I,
      obj.old,
      obj.oldSize,
      obj.neww,
      obj.newSize,
      x,
      obj.en,
      obj.pos
    );
  } //if all bytes are equal or first differing byte in lhs is more greater than in rhs
  else {
    return search(
      obj.I,
      obj.old,
      obj.oldSize,
      obj.neww,
      obj.newSize,
      obj.st,
      x,
      obj.pos
    );
  }
}

///////////////////////////////////////////////////////////////////
//
// A function that performs a diff between the two data streams and
// returns an array containing the control, diff and extra blocks
// that bsdiff produces.
//
///////////////////////////////////////////////////////////////////
function do_diff({ oldData, oldDataLength, newData, newDataLength } = {}) {
  try {
    let oldBuffer = new ArrayBuffer(oldDataLength);
    let newBuffer = new ArrayBuffer(newDataLength);
    let oldView = new Uint8Array(oldBuffer);
    let newView = new Uint8Array(newBuffer);
    //copy data from parameters to local arraybuffers
    oldView = copy(oldData);
    newView = copy(newData);

    let lastscan = 0,
      lastpos = 0,
      lastoffset = 0,
      oldscore = 0,
      scsc = 0,
      overlap = 0,
      Ss = 0,
      lens = 0,
      I = 0,
      V = 0,
      dblen = 0,
      eblen = 0,
      scan = 0,
      pos = 0,
      len = 0,
      s = 0,
      Sf = 0,
      lenf = 0,
      Sb = 0,
      lenb = 0,
      i = 0,
      temp,
      array = [3],
      db,
      eb;

    /* create the control array */
    let controlArrays = [];
    /* perform sort on original data */
    let obj_sort_old = {
      I: I,
      V: V,
      old: oldView,
      oldLength: oldDataLength,
    };
    qsufsort(obj_sort_old); // run this in another thread?

    /* perform the diff */
    while (scan < newDataLength) {
      //here put a line that makes the function interruptible( cause its blocking)
      //consider running this code in a Web worker
      oldscore = 0;
      //multithreading?
      for (scsc = scan += len; scan < newDataLength; scan++) {
        //search should propably take an object as arguement for passing by ref
        let obj_to_search = {
          I: I,
          oldData: oldView,
          oldSize: oldDataLength,
          newData: newView + scan,
          newSize: newDataLength - scan,
          st: 0,
          en: oldDataLength,
          pos: pos,
        };
        // len = search(
        //   I,
        //   oldData,
        //   oldDataLength,
        //   newData + scan,
        //   newDataLength - scan,
        //   0,
        //   oldDataLength,
        //   pos
        // );
        len = search(obj_to_search);
        for (; scsc < scan + len; scsc++) {
          if (
            scsc + lastoffset < oldDataLength &&
            oldView[scsc + lastoffset] == newView[scsc]
          )
            oldscore++;
        }
        if ((len == oldscore && len != 0) || len > oldscore + 8) break;
        if (
          scan + lastoffset < oldDataLength &&
          oldView[scan + lastoffset] == newView[scan]
        )
          oldscore--;
      }

      if (len != oldscore || scan == newDataLength) {
        for (i = 0; lastscan + i < scan && lastpos + i < oldDataLength; ) {
          if (oldView[lastpos + i] == newView[lastscan + i]) {
            s++;
          }
          i++;
          if (s * 2 - i > Sf * 2 - lenf) {
            Sf = s;
            lenf = i;
          }
        }

        if (scan < newDataLength) {
          for (i = 1; scan >= lastscan + i && pos >= i; i++) {
            if (oldView[pos - i] == newView[scan - i]) s++;
            if (s * 2 - i > Sb * 2 - lenb) {
              Sb = s;
              lenb = i;
            }
          }
        }

        if (lastscan + lenf > scan - lenb) {
          overlap = lastscan + lenf - (scan - lenb);
          for (i = 0; i < overlap; i++) {
            if (
              newView[lastscan + lenf - overlap + i] ==
              oldView[lastpos + lenf - overlap + i]
            )
              s++;
            if (newView[scan - lenb + i] == oldView[pos - lenb + i]) s--;
            if (s > Ss) {
              Ss = s;
              lens = i + 1;
            }
          }

          lenf += lens - overlap;
          lenb -= lens;
        }

        for (i = 0; i < lenf; i++) {
          db[dblen + i] = newView[lastscan + i] - oldView[lastpos + i];
        }
        for (i = 0; i < scan - lenb - (lastscan + lenf); i++) {
          eb[eblen + i] = newView[lastscan + lenf + i];
        }
        dblen += lenf;
        eblen += scan - lenb - (lastscan + lenf);

        array[0] = lenf;
        array[1] = scan - lenb - (lastscan + lenf);
        array[2] = pos - lenb - (lastpos + lenf);

        controlArrays.push(array);

        lastscan = scan - lenb;
        lastpos = pos - lenb;
        lastoffset = pos - scan;
      }
    }

    results = [3];
    results[0] = controlArrays;
    let AsBytes = new TextEncoder(); //Encode in utf-8 format
    temp = AsBytes.encode(db);
    results[1] = temp;
    temp = AsBytes.encode(eb);
    results[2] = temp;

    return results;
  } catch (Error) {
    console.error(Error);
  }
}

///////////////////////////////////////////////////////////////////
//
// A function that takes the original data and the control,
// diff and extra blocks produced by bsdiff and returns the new data.
//
///////////////////////////////////////////////////////////////////
function do_patch({
  oldData,
  oldDataLength,
  newDataLength,
  controlArrays,
  diffBlock,
  diffBlockLength,
  extraBlock,
  extraBlockLength,
} = {}) {
  try {
    //copy data from parameters to local structures
    let oldBuffer = new ArrayBuffer(oldDataLength);
    let newBuffer = new ArrayBuffer(newDataLength);
    let oldView = new Uint8Array(oldBuffer);
    let newView = new Uint8Array(newBuffer);
    oldView = copy(oldData);

    let delta = diffBlock,
      extra = extraBlock,
      oldpos = 0,
      newpos = 0,
      x,
      y,
      z,
      i,
      j,
      numArrays = controlArrays.length,
      array = [];
    let AsNumber = new TextDecoder();
    for (i = 0; i < numArrays; i++) {
      array.push(controlArrays[i]);

      if (array.length != 3) {
        throw new Error("Expecting control array size of 3");
      }
      x = array[0];
      //probably need to decode [1]&[2]
      y = AsNumber.decode(array[1]);
      z = AsNumber.decode(array[2]);
      if (
        newpos + x > newDataLength ||
        delta + x > diffBlock + diffBlockLength
      ) {
        throw new Error("corrupt patch (overflow)");
      }
      //consider using copy instead of memcpy
      memcpy(newView + newpos, delta, x);
      delta += x;
      for (j = 0; j < x; j++)
        if (oldpos + j >= 0 && oldpos + j < oldDataLength)
          newView[newpos + j] += oldData[oldpos + j];
      newpos += x;
      oldpos += x;
      if (
        newpos + y > newDataLength ||
        extra + y > extraBlock + extraBlockLength
      ) {
        throw new Error("corrupt patch (overflow)");
      }
      memcpy(newView + newpos, extra, y);
      extra += y;
      newpos += y;
      oldpos += z;
    }

    /* confirm that a valid patch was applied */
    if (
      newpos != newDataLength ||
      delta != diffBlock + diffBlockLength ||
      extra != extraBlock + extraBlockLength
    ) {
      throw new Error("corrupt patch (underflow)");
    }

    // let AsBytes = new TextEncoder(); //Encode in utf-8 format
    // results = AsBytes.encode(newData);
    return newBuffer;
  } catch (Error) {
    console.error(Error);
  }
}
