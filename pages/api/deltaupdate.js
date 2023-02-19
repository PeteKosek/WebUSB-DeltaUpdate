import { prisma } from "../../db_connectionSetup/prisma";
const { resolve, join } = require("path");
const { readFileSync } = require("fs"); //filesystem

//strucutre for storing image binaries along with their respective versions
let images = new Map([
  ["key", "zephyr.bin"],
  ["1.2.3", "value2"],
]);
//Request handler running bsdiff4 algorithm
export default async function handler(req, res) {
  //let data = await prisma.firmware.create();

  //if (req.method != "POST") return res.end();
  var version = req.body;
  var dir = resolve(process.cwd(), "images", images.get("key")); //save value for given key
  var neww = readFileSync(dir); //to load and display the binary

  return res.json({ version, image: images.get(version) });

  //res.redirect to chain APIs(parameters?)
}
