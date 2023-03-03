///////////////////////////////////////////////////////////////////
//
// An adaptation of C standard library function memcpy.
// Takes uint8array typed arrays as arguments and
//
///////////////////////////////////////////////////////////////////
function memcpy({ src, dst, length } = {}) {
  try {
    console.log("memcpy");
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

function memcmp(src, dst, length) {
  while (length-- > 0) {
    if (src++ != dst++) {
      if (src[-1] < dst[-1]) return -1;
      else return 1;
    }
  }
}

///////////////////////////////////////////////////////////////////
// A recursive function used in the sorting function. Splits
// src and dst data accroding to given index and length.
//
///////////////////////////////////////////////////////////////////
function split(I, V, start, len, h) {
  try {
    let i, j, k, x, tmp, jj, kk;

    if (len < 16) {
      //console.log("tiny splitting");
      for (k = start; k < start + len; k += j) {
        j = 1;
        x = V.at(I[k] + h);
        for (i = 1; k + i < start + len; i++) {
          if (V.at(I[k + i] + h) < x) {
            x = V.at(I[k + i] + h);
            j = 0;
          }
          if (V.at(I.at(k + i) + h) == x) {
            tmp = I.at(k + j);
            I[k + j] = I.at(k + i);
            I[k + i] = tmp;
            j++;
          }
        }
        for (i = 0; i < j; i++) {
          V[I[k + i]] = k + j - 1;
        }
        if (j == 1) I[k] = -1;
      }
    } else {
      //console.log("big splitting");
      // const y = Number(start + len / 2);
      // const l = I.at(y);
      // if (isNaN(l)) {
      //   throw new Error(" I returned a NaN");
      // }
      // x = V.at(l + h);
      x = V.at(I[start + len / 2] + h);
      console.log("x:", x);
      jj = 0;
      kk = 0;

      for (i = start; i < start + len; i++) {
        if (V.at(I[i] + h) < x) jj++;
        if (V.at(I[i] + h) == x) kk++;
      }
      jj += start;
      kk += jj;
      i = start;
      j = 0;
      k = 0;
      // console.log("x: %d", x);
      // console.log("i: %d", i);
      // console.log("jj: %d", jj);
      // console.log("kk: %d", kk);
      while (i < jj) {
        if (V.at(I[i] + h) < x) i++;
        else if (V.at(I[i] + h) == x) {
          //console.log("splitting3.1.3");
          tmp = I.at(i);
          I[i] = I.at(jj + j);
          I[jj + j] = tmp;
          j++;
        } else {
          tmp = I.at(i);
          I[i] = I.at(kk + k);
          I[kk + k] = tmp;
          k++;
        }
      }

      while (jj + j < kk) {
        if (V.at(I[jj + j] + h) == x) j++;
        else {
          tmp = I.at(jj + j);
          I[jj + j] = I.at(kk + k);
          I[kk + k] = tmp;
          k++;
        }
      }
      if (jj > start) {
        //console.log("recurse 1, jj: %d, len: %d", jj, jj - start);
        split(I, V, start, jj - start, h);
      }
      for (i = 0; i < kk - jj; i++) {
        V[I[jj + i]] = kk - 1;
      }

      if (jj == kk - 1) I[jj] = -1;

      if (start + len > kk) {
        //console.log("recurse 2");
        split(I, V, kk, start + len - kk, h);
      }
      return 0;
    }
  } catch (Error) {
    console.error(Error);
    return -1;
  }
}

///////////////////////////////////////////////////////////////////
// A quick suffix sorting function(N.J. Larssona,
// K. Sadakaneb, "Faster suffix sorting" 2007)
///////////////////////////////////////////////////////////////////
async function qsufsort(I, V, oldData, oldLength) {
  try {
    console.log("sorting");
    let buckets = [256],
      i,
      h,
      len;
    console.log(oldLength);
    //sorting buckets calc
    for (i = 0; i < 256; i++) {
      buckets[i] = 0;
    }
    for (i = 0; i < oldLength; i++) {
      buckets[oldData[i]]++;
      console.log(oldData[i]);
    }
    for (i = 1; i < 256; i++) {
      buckets[i] += buckets[i - 1];
    }
    for (i = 255; i > 0; i--) {
      buckets[i] = buckets[i - 1];
    }
    buckets[0] = 0;

    //I and V suffix arrays calc
    for (i = 0; i < oldLength; i++) {
      I[++buckets[oldData[i]]] = i;
    }
    I[0] = oldLength;
    for (i = 0; i < oldLength; i++) {
      V[i] = buckets.at(oldData[i]);
    }
    V[oldLength] = 0;
    for (i = 1; i < 256; i++) {
      if (buckets[i] == buckets[i - 1] + 1) I[buckets[i]] = -1;
    }
    I[0] = -1;

    console.log("buckets: ", buckets);
    //console.log("V: ", V);

    for (h = 1; I[0] != -(oldLength + 1); h += h) {
      len = 0;
      for (i = 0; i < oldLength + 1; ) {
        if (I.at(i) < 0) {
          len -= I.at(i);
          i -= I.at(i);
          console.log("sort call1: ", i);
        } else {
          if (len) {
            console.log("I[i - len]", I[i - len]);
            const Inew = i - len;
            if (Inew) I[Inew] = -len; //if Inew positive
            else I[I.length - Inew] = -len;
          }
          len = V.at(I[i]) + 1 - i;
          split(I, V, i, len, h);
          i += len;
          len = 0;
        }
      }
      //if len is positive
      if (len) {
        const Inew = i - len;
        if (Inew) I[Inew] = -len;
        else I[I.length - Inew] = -len;
      }
    }

    for (i = 0; i < oldLength + 1; i++) {
      I[V[i]] = i;
    }
  } catch (Error) {
    console.error(Error);
    return -1;
  }
}

///////////////////////////////////////////////////////////////////
//
// A function for checking the biggest common length of two arrays.
//
///////////////////////////////////////////////////////////////////
function matchlen(old, oldsize, neww, newsize) {
  let i;
  for (i = 0; i < oldsize && i < newsize; i++) {
    if (old.at(i) != neww.at(i)) break;
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
function search({ I, oldData, oldSize, newData, newSize, st, en, pos }) {
  let x, y;
  try {
    if (en - st < 2) {
      const oldDataScanX = oldData.subarray(I.at(st));
      const oldDataScanY = oldData.subarray(I.at(en));
      console.log("oldDataScanX: ", oldDataScanX);
      console.log("I.at(st): ", I.at(st));
      console.log("oldData: ", oldData);
      // x = matchlen(oldData + I.at(st), oldSize - I.at(st), newData, newSize);
      // y = matchlen(oldData + I.at(en), oldSize - I.at(en), newData, newSize);
      x = matchlen(oldDataScanX, oldDataScanX.length, newData, newSize);
      y = matchlen(oldDataScanY, oldDataScanX.length, newData, newSize);

      if (x > y) {
        pos = I.at(st);
        if (isNaN(pos)) {
          console.log("x: ", x);
          throw new Error("search function error");
        }
        console.log("x: ", x);
        return x;
      } else {
        pos = I.at(en);
        if (isNaN(pos)) {
          console.log("en: ", en);
          console.log("y: ", y);
          throw new Error("search function error");
        }
        console.log("y: ", y);
        return y;
      }
    }
    //this is calculating position of element from array I
    x = Math.floor(st + (en - st) / 2); // round down to avoid fraction numbers(alas int)

    // for (let i = 0; i < ix; i++) {
    //   //means take the pointer to beginning of oldData and move it by value of I
    //   console.log("oldData.at(i + I.at(x))", oldData.at(i + I.at(x)));
    //   if (oldData.at(i + I.at(x)) < newData.at(i)) {
    //     //if first differing byte on left side is less than right side
    //     //console.log("x: ", x);
    //     //console.log("I.at(x): ", I.at(x));
    //     return search({
    //       // I: I,
    //       // oldData: oldData,
    //       // oldSize: oldSize,
    //       // newData: newData,
    //       // newSize: newSize,
    //       // st: x,
    //       // en: en,
    //       // pos: pos,
    //       I: I,
    //       oldData: oldData,
    //       oldSize: oldSize,
    //       newData: newData,
    //       newSize: newSize,
    //       st: st,
    //       en: x,
    //       pos: pos,
    //     });
    //   } else {
    //     //if all bytes are equal or
    //     ///first differing byte on left side is greater than right side
    //     console.log("st: ", st);
    //     //console.log("I.at(x): ", I.at(x));
    //     return search({
    //       // I: I,
    //       // oldData: oldData,
    //       // oldSize: oldSize,
    //       // newData: newData,
    //       // newSize: newSize,
    //       // st: st,
    //       // en: x,
    //       // pos: pos,
    //       I: I,
    //       oldData: oldData,
    //       oldSize: oldSize,
    //       newData: newData,
    //       newSize: newSize,
    //       st: x,
    //       en: en,
    //       pos: pos,
    //     });
    //   }
    // }
    const ix = Math.min(oldSize - I.at(x), newSize);
    const oldDataCmp = oldData.subarray(I.at(x));
    if (memcmp(oldDataCmp, newData, ix)) {
      return search({
        I: I,
        oldData: oldData,
        oldSize: oldSize,
        newData: newData,
        newSize: newSize,
        st: x,
        en: en,
        pos: pos,
      });
    } else {
      return search({
        I: I,
        oldData: oldData,
        oldSize: oldSize,
        newData: newData,
        newSize: newSize,
        st: st,
        en: x,
        pos: pos,
      });
    }
  } catch (Error) {
    console.error(Error);
    return;
  }
}

///////////////////////////////////////////////////////////////////
//
// A function that performs a diff between the two data streams and
// returns an array containing the control, diff and extra blocks
// that bsdiff produces.
//
///////////////////////////////////////////////////////////////////
export async function do_diff(oldData, oldDataLength, newData, newDataLength) {
  try {
    console.log("diffing");
    let lastscan, lastpos, lastoffset, oldscore, scsc, overlap, Ss;
    let lens, dblen, eblen, scan, pos, len, s;
    let Sf, lenf, Sb, lenb, i, temp;

    /* create the control array */
    let controlArrays = [],
      cArray = Buffer.alloc(3);

    let I = new Int8Array(oldDataLength + 1),
      V = new Int8Array(oldDataLength + 1);

    /* perform suffix sort on original data */
    console.log(oldDataLength);
    await qsufsort(I, V, oldData, oldDataLength);
    console.log("old data sorted");
    console.log("I:", I);
    console.log("V:", V);

    let db = Buffer.alloc(newDataLength + 1), //diff blocks
      eb = Buffer.alloc(newDataLength + 1); //extra blocks

    dblen = 0;
    eblen = 0;

    /* perform the diff */
    len = 0;
    scan = 0;
    lastscan = 0;
    lastpos = 0;
    lastoffset = 0;
    pos = 0;
    while (scan < newDataLength) {
      oldscore = 0;
      for (scsc = scan += len; scan < newDataLength; scan++) {
        len = search({
          I: I,
          oldData: oldData,
          oldSize: oldDataLength,
          newData: newData.subarray(scan),
          newSize: newDataLength - scan,
          st: 0,
          en: oldDataLength,
          pos: pos,
        });
        console.log("len from search: ", len);
        if (isNaN(len)) throw new Error("search function error");
        for (; scsc < scan + len; scsc++) {
          if (
            scsc + lastoffset < oldDataLength &&
            oldData[scsc + lastoffset] == newData[scsc]
          )
            oldscore++;
        }
        if ((len == oldscore && len != 0) || len > oldscore + 8) break;
        if (
          scan + lastoffset < oldDataLength &&
          oldData[scan + lastoffset] == newData[scan]
        )
          oldscore--;
      }

      if (len != oldscore || scan == newDataLength) {
        for (i = 0; lastscan + i < scan && lastpos + i < oldDataLength; ) {
          if (oldData[lastpos + i] == newData[lastscan + i]) {
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
            if (oldData[pos - i] == newData[scan - i]) s++;
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
              newData[lastscan + lenf - overlap + i] ==
              oldData[lastpos + lenf - overlap + i]
            )
              s++;
            if (newData[scan - lenb + i] == oldData[pos - lenb + i]) s--;
            if (s > Ss) {
              Ss = s;
              lens = i + 1;
            }
          }

          lenf += lens - overlap;
          lenb -= lens;
        }
        console.log("db: ", db);
        console.log("dblen: ", dblen);

        for (i = 0; i < lenf; i++) {
          db[dblen + i] = newData[lastscan + i] - oldData[lastpos + i];
        }
        for (i = 0; i < scan - lenb - (lastscan + lenf); i++) {
          eb[eblen + i] = newData[lastscan + lenf + i];
        }
        dblen += lenf;
        eblen += scan - lenb - (lastscan + lenf);

        cArray.write(lenf, 0, 4, "utf8");
        cArray.write(scan - lenb - (lastscan + lenf), 4, 4, "utf8");
        cArray.write(pos - lenb - (lastpos + lenf), 8, 4, "utf8");
        controlArrays.push(cArray);

        lastscan = scan - lenb;
        lastpos = pos - lenb;
        lastoffset = pos - scan;
      }
    }

    let results = [3];
    results[0] = controlArrays;
    results[1] = db;
    results[2] = eb;

    return results;
  } catch (Error) {
    console.error(Error);
    return -1;
  }
}

///////////////////////////////////////////////////////////////////
//
// A function that takes the original data and the control,
// diff and extra blocks produced by bsdiff and returns the new data.
//
///////////////////////////////////////////////////////////////////
export function do_patch({
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
    console.log("patching");
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
