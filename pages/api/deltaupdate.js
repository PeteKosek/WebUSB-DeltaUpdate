const { resolve, join } = require("path");
const { readFileSync } = require("fs"); //filesystem
import { diff, patch } from "../../external/bsdiff4";
//strucutre for storing image binaries along with their respective versions
let images = new Map([
  ["key", "zephyr.bin"],
  ["1.2.3", "value2"],
]);

///////////////////////////////////////////////////////////////////
// A function for converting a buffer object to ArrayBuffer.
// Returns new ArrayBuffer with conents of given buffer.
//
// Author: Martin Thomson
// Date: Aug 23, 2012
// URL: https://stackoverflow.com/questions/8609289/convert-a-binary-nodejs-buffer-to-javascript-arraybuffer
///////////////////////////////////////////////////////////////////
function toArrayBuffer(buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}

//Request handler running bsdiff4 algorithm
export default async function handler(req, res) {
  //if (req.method != "POST") return res.end();

  //get old image
  var version = req.body;
  var oldDir = resolve(process.cwd(), "images", images.get(version)); //get path to newest version of image
  var oldImg = readFileSync(oldDir); //to load and display the binary

  //get newest image
  var newDir = resolve(
    process.cwd(),
    "images",
    images.get(images.entries().next().value)
  );
  var newImg = readFileSync(newDir);

  const arrBuff_oldImg = toArrayBuffer(oldImg);
  const arrBuff_newImg = toArrayBuffer(newImg);
  //diff here after converting newImg and oldImg to arraybuffer
  const arrBuff_diff = diff(arrBuff_oldImg, arrBuff_newImg);

  //return res.json({ version, image: images.get(version) });
  return res.json({ arrBuff_diff });
  //res.redirect to chain APIs(parameters?)?
}
