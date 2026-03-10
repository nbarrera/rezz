import sharp from "sharp";

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#8EC4A2"/>
  <text x="256" y="340" font-family="sans-serif" font-size="320" font-weight="700"
        text-anchor="middle" fill="#1A1918">R</text>
</svg>`;

const buf = Buffer.from(SVG);
await sharp(buf).resize(192).toFile("public/icon-192.png");
await sharp(buf).resize(512).toFile("public/icon-512.png");
await sharp(buf).resize(180).toFile("public/apple-touch-icon.png");
console.log("Icons generated: public/icon-192.png, icon-512.png, apple-touch-icon.png");
