---
sku:
slug:
name:
brand:
sizes: []                    # exact Size-attribute labels, in order (columns of the chart)
meta_title: ""               # ≤60 chars, UK English
meta_description: ""         # ≤155 chars, UK English
size_guide_option_id:        # filled after the size chart is created in admin (POPULATE_PRODUCT.md §5)
images:                      # source URLs to approve, then upload
  - role: base               # base = image+small_image+thumbnail; extra = gallery only
    source:
    label: ""
  - role: extra
    source:
    label: ""
sources: []                  # every claim above must trace to one of these
status: draft                # draft → reviewed → published
---

## description
```html
<p>Intro — condition, who it's for, top-line benefit.</p>
<h3>Benefit theme one</h3>
<p>…</p>
<h3>Benefit theme two</h3>
<p>…</p>
<h3>Benefit theme three</h3>
<p>…</p>
<h3>Order Yours Today</h3>
<p>CTA.</p>
<hr/>
<h2>FAQs</h2>
<h3>Question?</h3>
<p>Answer.</p>
```

## short_description
```html
<ul><li>Key feature 1</li><li>Key feature 2</li><li>Key feature 3</li></ul>
```

## size_guide
```html
<div>
  <h2>Sizing Guide</h2>
  <p>Brace-appropriate intro — how to measure to find the right size.</p>
  <div class="sizeGrid">
    <div>
      <h3>Where to measure?</h3>
      <h4>1. Choosing a Size</h4>
      <p>Circumference measurements in cm for the following points:</p>
      <ul><li>cX - … </li></ul>
    </div>
    <div>
      <div class="measurement-image"><a class="zoom-image size-diagram" href="/media/size-chart/diagrams/l/NAME.png"><img src="/media/size-chart/diagrams/s/NAME.png"><span>Click to enlarge</span></a></div>
    </div>
  </div>
  <div class="scroller"><div>
    <table class="sizing sizing--scroll" data-scroller=""><caption>1. Size Chart</caption>
      <thead><tr><th scope="col">Circumference</th><!-- one <th> per size --></tr></thead>
      <tbody>
        <tr><td data-title="Circumference">cX</td><!-- one <td data-title="SIZE">range</td> per size --></tr>
      </tbody>
    </table>
  </div></div>
</div>
```
