import test from 'node:test';
import assert from 'node:assert/strict';
import {extractPreview} from '../lib/template-sources/preview.ts';
const wrap = html => `<div class="l-img-cont Content-body">${html}</div>`;
test('extracts independent components without duplicating nested layout',()=>{
 const data=extractPreview(wrap('<section class="xmyeditor" data-id="1">标题<section class="xmyeditor" data-id="2">副标题</section></section><section class="xmyeditor" data-id="3"><img src="https://web2.xmyeditor.com/a.png"></section>'));
 assert.equal(data.components.length,2);assert.equal(data.components[0].kind,'标题');assert.equal(data.components[1].kind,'图片组件');assert.match(data.html,/data-component="component-0"/);
});
test('removes active content, handlers, external CSS and unsafe links',()=>{
 const data=extractPreview(wrap('<section class="xmyeditor" data-id="1" onclick="evil()" style="position:fixed;background:url(https://evil.example/a)"><script>evil()</script><iframe src="https://evil.example"></iframe><a href="javascript:evil()">标题</a><img src="javascript:evil()" onerror="evil()"></section>'));
 assert.doesNotMatch(data.html,/script|iframe|onclick|onerror|javascript:|position:fixed|evil.example/);
});
test('missing preview fails explicitly',()=>assert.throws(()=>extractPreview('<h1>登录</h1>')));
test('preserves SVG foreignObject layout, casing, animation and original opacity',()=>{
 const data=extractPreview(wrap('<section class="xmyeditor" data-id="1"><svg viewBox="0 0 375 405" preserveAspectRatio="xMidYMid meet"><g opacity="0"><animateTransform attributeName="transform" type="translate" from="0 40" to="0 0" dur="1s" fill="freeze"></animateTransform><animate attributeName="opacity" from="0" to="1" dur="1s" fill="freeze"></animate><foreignObject width="375" height="405"><section><p>封面标题</p><img src="https://web2.xmyeditor.com/header.png"></section></foreignObject></g></svg></section>'));
 assert.match(data.html, /viewBox="0 0 375 405"/);
 assert.match(data.html, /<foreignObject[^>]*width="375"[^>]*height="405"/);
 assert.match(data.html, /<g opacity="0">/);
 assert.match(data.html, /<animateTransform[^>]*attributeName="transform"/);
 assert.match(data.html, /<animate[^>]*attributeName="opacity"/);
 assert.match(data.html, /封面标题/);
});
test('keeps source background artwork and local SVG references, rejects URL-changing animation',()=>{
 const data=extractPreview(wrap('<section style="background-image:url(https://web2.xmyeditor.com/header.png)"><svg><g style="clip-path:url(#cover)"><set attributeName="href" to="javascript:alert(1)"></set></g></svg></section>'));
 assert.match(data.html,/web2\.xmyeditor\.com\/header\.png/);
 assert.match(data.html,/url\(#cover\)/);
 assert.doesNotMatch(data.html,/attributeName="href"|javascript:/);
});
