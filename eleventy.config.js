import path from "node:path";
import fs from "node:fs";
import Image from "@11ty/eleventy-img";

const escapeHtml = (str = "") =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// **vet** → <strong>, na escapen
const inline = (str = "") => escapeHtml(str).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

// Zet een pad uit de CMS (/images/uploads/x.jpg) om naar een bronbestand in src/
const toSrc = (src) => path.join("src", src.replace(/^\/+/, ""));

async function imageHtml(src, alt = "", sizes = "100vw", cls = "", loading = "lazy", widths) {
  if (!src) return "";
  const input = toSrc(src);
  if (!fs.existsSync(input)) {
    console.warn(`[img] Afbeelding niet gevonden: ${src}`);
    return "";
  }
  const metadata = await Image(input, {
    widths: widths || [400, 800, 1200, 1600, "auto"],
    formats: ["webp"],
    outputDir: "_site/img/",
    urlPath: "/img/",
    filenameFormat: (id, file, width, format) =>
      `${path.parse(file).name}-${width}w.${format}`,
  });
  return Image.generateHTML(metadata, {
    alt: alt || "",
    sizes,
    loading,
    decoding: "async",
    ...(cls ? { class: cls } : {}),
    ...(loading === "eager" ? { fetchpriority: "high" } : {}),
  });
}

async function imageUrl(src, width = 1200) {
  if (!src) return "";
  const input = toSrc(src);
  if (!fs.existsSync(input)) return "";
  const metadata = await Image(input, {
    widths: [width],
    formats: ["jpeg"],
    outputDir: "_site/img/",
    urlPath: "/img/",
    filenameFormat: (id, file, w, format) => `${path.parse(file).name}-${w}w.${format}`,
  });
  return metadata.jpeg[0].url;
}

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/fonts": "fonts" });
  eleventyConfig.addPassthroughCopy({ "src/images/static": "images/static" });
  eleventyConfig.addPassthroughCopy({ "src/videos": "videos" });
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });
  eleventyConfig.addPassthroughCopy({ "src/_headers": "_headers" });
  eleventyConfig.addPassthroughCopy({ "src/_redirects": "_redirects" });
  eleventyConfig.addPassthroughCopy({ "src/images/static/favicon.png": "favicon.png" });

  eleventyConfig.addAsyncShortcode("img", imageHtml);
  eleventyConfig.addAsyncShortcode("imgUrl", imageUrl);

  // Tekstveld → alinea's (lege regel), lijstjes (regels met "- ") en **vet**
  eleventyConfig.addFilter("paragraphs", (text = "") => {
    const blocks = String(text || "").replace(/\r\n/g, "\n").trim().split(/\n\s*\n/);
    return blocks
      .filter((b) => b.trim())
      .map((block) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.every((l) => /^[-•]\s+/.test(l))) {
          return "<ul>" + lines.map((l) => `<li>${inline(l.replace(/^[-•]\s+/, ""))}</li>`).join("") + "</ul>";
        }
        return `<p>${lines.map(inline).join("<br>")}</p>`;
      })
      .join("\n");
  });

  // Eén regel tekst met **vet**, zonder alinea's
  eleventyConfig.addFilter("inline", inline);

  eleventyConfig.addFilter("plain", (text = "") =>
    String(text || "").replace(/\*\*/g, "").replace(/\s+/g, " ").trim()
  );

  eleventyConfig.addFilter("roman", (n) => ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n] || String(n + 1));

  eleventyConfig.addFilter("absoluteUrl", (url, base) => {
    if (!url) return "";
    if (/^https?:\/\//.test(url)) return url;
    return String(base || "").replace(/\/+$/, "") + (url.startsWith("/") ? url : "/" + url);
  });

  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addGlobalData("buildYear", () => new Date().getFullYear());

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk",
  };
}
