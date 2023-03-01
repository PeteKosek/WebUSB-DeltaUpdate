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

///////////////////////////////////////////////////////////////////
// A recursive function used in the sorting function. Splits
// src and dst data accroding to given index and length.
//
///////////////////////////////////////////////////////////////////
async function split({ I, V, start, len, h } = {}) {
  try {
    let i, j, k, x, tmp, jj, kk;
    //console.log("I: ", I);
    if (len < 16) {
      //console.log("tiny splitting");
      for (k = start; k < start + len; k += j) {
        j = 1;
        x = V.at(I.at(k) + h);
        for (i = 1; k + i < start + len; i++) {
          if (V.at(I.at(k + i) + h) < x) {
            //console.log("tiny splitting 1");
            x = V.at(I.at(k + i) + h);
            j = 0;
          }
          if (V.at(I.at(k + i) + h) == x) {
            //console.log("tiny splitting 2");
            tmp = I.at(k + j);
            I[k + j] = I.at(k + i);
            I[k + i] = tmp;
            j++;
          }
        }
        for (i = 0; i < j; i++) {
          V[I.at(k + i)] = k + j - 1;
        }
        if (j == 1) {
          //console.log("tiny splitting 3");
          I[k] = -1;
        }
      }
    } else {
      //console.log("big splitting");
      const y = Number(start + len / 2);
      const l = I.at(y);
      if (isNaN(l)) {
        throw new Error(" I returned a NaN");
      }
      x = V.at(l + h);

      jj = 0;
      kk = 0;

      for (i = start; i < start + len; i++) {
        if (V.at(I.at(i) + h) < x) jj++;
        if (V.at(I.at(i) + h) == x) kk++;
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
        if (V.at(I.at(i) + h) < x) {
          //console.log("splitting3.1.2");
          i++;
        } else if (V.at(I.at(i) + h) == x) {
          //console.log("splitting3.1.3");
          tmp = I.at(i);
          I[i] = I.at(jj + j);
          I[jj + j] = tmp;
          j++;
        } else {
          //console.log("splitting3.1.4");
          tmp = I.at(i);
          I[i] = I.at(kk + k);
          I[kk + k] = tmp;
          k++;
        }
      }
      while (jj + j < kk) {
        if (V.at(I.at(jj + j) + h) == x) {
          //console.log("splitting3.2.2");
          j++;
        } else {
          //console.log("splitting3.2.3");
          tmp = I.at(jj + j);
          I[jj + j] = I.at(kk + k);
          I[kk + k] = tmp;
          k++;
        }
      }
      if (jj > start) {
        //console.log("recurse 1, jj: %d, len: %d", jj, jj - start);
        await split({ I: I, V: V, start: start, len: jj - start, h: h });
      }
      for (i = 0; i < kk - jj; i++) {
        V[I[jj + i]] = kk - 1;
      }

      if (jj == kk - 1) {
        // console.log("splitting3.4.1");
        I[jj] = -1;
      }

      if (start + len > kk) {
        //console.log("recurse 2");
        //console.log(len == kk);
        await split({ I: I, V: V, start: kk, len: start + len - kk, h: h });
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
async function qsufsort({ I, V, oldData, oldLength } = {}) {
  try {
    console.log("sorting");
    let buckets = [256],
      i,
      h,
      len;

    for (i = 0; i < 256; i++) {
      buckets[i] = 0;
    }
    for (i = 0; i < oldLength; i++) {
      buckets[oldData.at(i)]++;
    }
    for (i = 1; i < 256; i++) {
      buckets[i] += buckets[i - 1];
    }
    for (i = 255; i > 0; i--) {
      buckets[i] = buckets[i - 1];
    }
    buckets[0] = 0;
    for (i = 0; i < oldLength; i++) {
      I[++buckets[oldData.at(i)]] = i;
    }
    I[0] = oldLength;
    for (i = 0; i < oldLength; i++) {
      V[i] = buckets[oldData.at(i)];
    }
    V[oldLength] = 0;
    for (i = 1; i < 256; i++) {
      if (buckets[i] == buckets[i - 1] + 1) I[buckets[i]] = -1;
    }
    I[0] = -1;

    for (h = 1; I[0] != -(oldLength + 1); h += h) {
      len = 0;
      for (i = 0; i < oldLength + 1; ) {
        if (I[i] < 0) {
          len -= I.at(i);
          i -= I.at(i);
        } else {
          if (len) I[i - len] = -len;
          len = V.at(I.at(i)) + 1 - i;
          //console.log("sort call: ", i);
          //console.log("len: ", len);
          if ((await split({ I: I, V: V, start: i, len: len, h: h })) == -1) {
            throw new Error(" splitting error");
          }
          i += len;
          len = 0;
        }
      }
      if (len) I[i - len] = -len;
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

    const ix = Math.min(oldSize - I.at(x), newSize);
    for (let i = 0; i < ix; i++) {
      //means take the pointer to beginning of oldData and move it by value of I
      console.log("i + I.at(x)", i + I.at(x));
      if (oldData.at(i + I.at(x)) < newData.at(i)) {
        //if first differing byte on left side is less than right side
        //console.log("x: ", x);
        //console.log("I.at(x): ", I.at(x));
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
        //if all bytes are equal or
        ///first differing byte on left side is greater than right side
        console.log("st: ", st);
        //console.log("I.at(x): ", I.at(x));
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
export async function do_diff({
  oldData,
  oldDataLength,
  newData,
  newDataLength,
} = {}) {
  try {
    console.log("diffing");
    //create local views on the bytes arrays passed as arguments
    const oldView = new Int8Array(oldData);
    const newView = new Int8Array(newData);
    let AsBytes = new TextEncoder(); //Encode in utf-8 format

    let lastscan = 0,
      lastpos = 0,
      lastoffset = 0,
      oldscore = 0,
      scsc = 0,
      overlap = 0,
      Ss = 0,
      lens = 0,
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
      array = [3];

    let I = new Int8Array(oldDataLength + 1),
      V = new Int8Array(oldDataLength + 1),
      db = new Int8Array(newDataLength + 1), //diff blocks
      eb = new Int8Array(newDataLength + 1); //extra blocks

    /* create the control array */
    let controlArrays = [];
    // Suffix sorting does not seem to cooperate with Typed arrays, hence
    // i will use a built in array sort method
    /* perform suffix sort on original data */
    await qsufsort({
      I: I,
      V: V,
      oldData: oldView,
      oldLength: oldDataLength,
    });
    console.log("old data sorted");
    console.log("I:", I);
    /* perform the diff */
    while (scan < newDataLength) {
      oldscore = 0;
      for (scsc = scan += len; scan < newDataLength; scan++) {
        //search should propably take an object as arguement for passing by ref
        const newViewScan = newView.subarray(scan);
        len = search({
          I: I,
          oldData: oldView,
          oldSize: oldDataLength,
          //newData: newView + scan, //means take the pointer to beggining of newView and move it by value of scan
          newData: newViewScan,
          //newSize: newDataLength - scan,
          newSize: newViewScan.length,
          st: 0,
          en: oldDataLength,
          pos: pos,
        });
        if (isNaN(len)) {
          throw new Error("search function error");
        }
        console.log("len from search: ", len);
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
        console.log("db: ", db);
        console.log("dblen: ", dblen);

        for (i = 0; i < lenf; i++) {
          db[dblen + i] = newView[lastscan + i] - oldView[lastpos + i];
        }
        for (i = 0; i < scan - lenb - (lastscan + lenf); i++) {
          eb[eblen + i] = newView[lastscan + lenf + i];
        }
        dblen += lenf;
        eblen += scan - lenb - (lastscan + lenf);

        array[0] = AsBytes.encode(lenf);
        array[1] = AsBytes.encode(scan - lenb - (lastscan + lenf));
        array[2] = AsBytes.encode(pos - lenb - (lastpos + lenf));

        controlArrays.push(array);

        lastscan = scan - lenb;
        lastpos = pos - lenb;
        lastoffset = pos - scan;
      }
    }

    let results = [3];
    results[0] = controlArrays;
    temp = AsBytes.encode(db);
    results[1] = temp;
    temp = AsBytes.encode(eb);
    results[2] = temp;

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
