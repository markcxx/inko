import { load } from "cheerio";
import sanitizeHtml from "sanitize-html";
export type TemplateComponent = { id: string; kind: string; label: string; html: string; parentId?: string };
export type TemplatePreview = { html: string; components: TemplateComponent[] };
export function extractPreview(html: string, source: "xiumi" | "96" | "xmy" | "135-official" = "xmy"): TemplatePreview {
  const $ = load(html, {}, false);
  const root = source === "xiumi" ? $(".xiumi-template").first() : source === "96" ? $(".detail_left.material_tpl .detail_block_style").first() : source === "135-official" ? $(".l-img-cont.Content-body").first() : $(".tpl_ratio").first().length ? $(".tpl_ratio").first() : $("<div></div>").append($.root().contents());
  const hasContent = root.find(".xmyeditor,.tn-comp,.tn-cell,._editor,p,img,svg,table,hr").length > 0;
  if (!root.length || !hasContent) throw new Error("原站未提供可用的完整模板预览。");
  const clean = sanitizeHtml(root.is(".tpl_ratio,.xiumi-template") ? $.html(root) : root.html() || "", {
    parser: { lowerCaseTags: false, lowerCaseAttributeNames: false },
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "tspan", "defs", "clipPath", "image", "use", "linearGradient", "radialGradient", "stop", "foreignObject", "animate", "animateTransform", "set"],
    allowedAttributes: {
      "*": ["style", "class", "data-id", "data-role", "data-type", "tpl-ratio", "tn-uuid", "tn-cell-type", "data-xiumi-kind", "width", "height", "viewBox", "xmlns", "xmlns:xlink", "xml:space", "fill", "fill-rule", "fill-opacity", "stroke", "stroke-width", "stroke-opacity", "stroke-linecap", "stroke-linejoin", "stroke-dasharray", "d", "x", "y", "x1", "x2", "y1", "y2", "cx", "cy", "r", "rx", "ry", "points", "transform", "opacity", "offset", "stop-color", "stop-opacity", "clip-path", "clipPathUnits", "id", "preserveAspectRatio", "text-anchor", "dominant-baseline", "font-size", "font-family", "font-weight", "gradientUnits", "gradientTransform", "spreadMethod"],
      img: ["src", "alt", "style", "width", "height"],
      image: ["href", "xlink:href", "width", "height", "x", "y", "preserveAspectRatio"],
      use: ["href", "xlink:href"],
      animate: ["attributeName", "attributeType", "from", "to", "values", "begin", "end", "dur", "repeatCount", "repeatDur", "restart", "calcMode", "keyTimes", "keySplines", "additive", "accumulate"],
      animateTransform: ["attributeName", "attributeType", "type", "from", "to", "values", "begin", "end", "dur", "repeatCount", "repeatDur", "restart", "calcMode", "keyTimes", "keySplines", "additive", "accumulate"],
      set: ["attributeName", "attributeType", "to", "begin", "end", "dur", "repeatCount", "restart"],
    },
    // Preserve visual SMIL animation, never animation that changes links or code.
    exclusiveFilter: frame => ["animate", "animateTransform", "set"].includes(frame.tag) && !["transform", "opacity", "visibility", "fill", "fill-opacity", "stroke", "stroke-opacity", "stroke-dashoffset", "x", "y", "width", "height"].includes(frame.attribs.attributeName || ""),
    allowedSchemes: ["https"], allowProtocolRelative: false,
  });
  const doc = load(clean, {}, false);
  doc("[style]").each((_, node) => {
    const style = doc(node).attr("style") || "";
    // Retain source artwork and fragment references used by SVG clipping/gradients.
    // The iframe isolates layout; scripts, event handlers and unsafe URLs stay excluded.
    doc(node).attr("style", style
      .replace(/(?:position\s*:\s*(?:fixed|sticky)|[^;{}]*expression\([^)]*\)[^;{}]*)\s*;?/gi, "")
      .replace(/url\(\s*(["']?)(.*?)\1\s*\)/gi, (_match, _quote: string, address: string) => {
        if (/^#[a-zA-Z0-9_-]+$/.test(address)) return `url(${address})`;
        try {
          const url = new URL(address);
          if (url.protocol === "https:" && (source === "xiumi" ? /(?:^|\.)(?:xiumi\.us|xiumius\.cn)$/ : source === "96" ? /(?:^|\.)96weixin\.com$/ : source === "135-official" ? /(?:^|\.)135editor\.com$/ : /(?:^|\.)xmyeditor\.(?:com|cn)$/).test(url.hostname)) return `url("${url.href}")`;
        } catch { /* Omit invalid CSS resource URLs. */ }
        return "none";
      }));
  });
  // Keep both source layout groups and their editable children. Ungrouped text
  // and images also become selectable, instead of disappearing between data-id blocks.
  const blocks = doc('.tn-comp, .tn-cell-text, .tn-cell-image, .tn-cell-group, .xmyeditor, ._135editor, ._editor, [data-role="absolute-layout"], figure, h1, h2, h3, h4, h5, h6, p, img, image').filter((_, node) => {
    const block = doc(node);
    if (["img", "image"].includes(node.tagName)) return true;
    return !!block.text().trim() || block.find("img,image,svg").length > 0;
  });
  const components: TemplateComponent[] = [];
  blocks.each((index, node) => {
    const block = doc(node), text = block.text().replace(/\s+/g, " ").trim(), images = block.find("img,image").length + (block.is("img,image") ? 1 : 0);
    const kind = block.attr("data-xiumi-kind") || (block.find('[data-role="absolute-layout"]').length ? "图文组合" : text.length > 45 ? (images > 1 ? "图文组合" : "正文框") : text ? (images > 1 ? "图文组合" : "标题") : images > 1 ? "多图布局" : images ? "图片组件" : "装饰组件");
    const id = `component-${index}`;
    const fragment = doc.html(block.clone().find("[data-component]").removeAttr("data-component tabindex role aria-label").end());
    block.attr("data-component", id).attr("tabindex", "0").attr("role", "button").attr("aria-label", `选择${kind}组件`);
    const parentId = block.parents("[data-component]").first().attr("data-component");
    components.push({ id, parentId, kind, label: text.slice(0, 36) || `${kind} ${index + 1}`, html: fragment });
  });
  return { html: doc.html(), components };
}
