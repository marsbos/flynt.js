![Bundle Size](https://img.shields.io/badge/size-2.2KB%20minified-brightgreen?style=fflat-square&logo=javascript)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen?style=flat-square)

<p align="center">
  <img src="logo.svg" alt="Flynt.js Logo" width="80" height="auto" />
</p>

# ⚡️ Flynt.js

**Flynt.js** is a lightweight, zero-build reactivity library built specifically for **Multi-Page Applications (MPAs)** like Magento/Hyvä, Blade, or WordPress. 

It organizes UI logic into clean, decoupled **Presenters** without the bloat, virtual DOM, or build step of full SPA frameworks.

* **Built for MPAs:** Add reactivity to server-rendered HTML effortlessly.
* **Presenter Pattern:** Decouple reactive state logic cleanly from your DOM.
* **Zero Build Step & 2.2 kB:** Drop in a single tiny CDN script tag and start coding.
* **Zero Lifecycle Overhead:** No unmount hooks or cleanup complexity — browser garbage collection handles it naturally on page navigation.

---

## 💻 Quick Start

### 1. Include script
```html
 <script src="https://cdn.jsdelivr.net/gh/marsbos/flynt.js@v1.0.1/flynt.min.js"></script>
```

### 2. Bind HTML (DOM)
```html
<div>
  <button data-fx="countPresenter.incrBtn">Increment</button>
  <button data-fx="countPresenter.decrBtn">Decrement</button>
  <span data-fx="countPresenter.counter"></span>
</div>
```

### 3. Define Presenter (Logic)
```html
<script>
      window.countPresenter = fx.presenter(({ createState, render }) => {
        const state = createState({
          count: 0,
          // Derived state via standard JS getters
          get double() { return this.count * 2; }
        });
        return {
          incrBtn(el) {
            el.onclick = () => state.count++;
          },
          decrBtn(el) {
            el.onclick = () => state.count--;
          },
          counter(el) {
            render(() => {
              el.innerText = `count=${state.count}, double=${state.double}`;
            });
          },
        };
      });
    </script>
```
---

## 🧪 Examples

#### 1. `Codepen` examples: [Flynt.js](https://codepen.io/collection/OyMeQW)

#### 2. Browse the examples folder in this repo

> More demo's coming soon...


---


## 📖 API Reference

### DOM Attribute
`data-fx="PresenterName.methodName"`
Binds a DOM element to a specific method inside a Presenter. Flynt.js automatically initializes the binding when the element is parsed.


### Core Methods
`fx.presenter(setupFn)` Creates a new Presenter context.


* **Parameters:** `function`
  * setupFn (Function): A setup function receiving helpers { createState, render, map, debounce, request }. Must return an object with component/presenter methods.

`createState(initialState)` Creates a reactive state object inside a Presenter context.
Supports standard JavaScript getters for derived state.


* **Parameters:** `object`
  * initialState (Object)

Returns: JS object that triggers re-renders when mutated.

`render(callback)`
Registers a reactive effect that automatically re-runs whenever accessed state properties change.

* **Parameters:** `function`
  * callback (Function) — The DOM update logic to run.

`map(containerElement)` Higher-Order Factory for list reconciliation. Returns an itemsUpdater function tied to containerElement.
* **Parameters:** `Element`
  * element: A dom element acting as the container for the reconciliation operation
  
```js
const mapItems = map(containerElement);
mapItems([{ key: 1, html: "<li>Item 1</li>" }]);
```

- $O(1)$ Lookup Cache: Retains physical DOM references across renders.
- In-Place Updates: Only replaces elements whose outerHTML has changed.
- Order Preservation: Uses insertBefore() to reorder nodes without losing focus or event listeners.


`debounce(fn, delay)` Delays function execution until delay milliseconds have passed since the last invocation.
* **Parameters:** `function, number`
  * fn (Function), delay (Number)

`request()` Creates an isolated, abortable request runner. Multiple calls on the same runner will automatically cancel the previous in-flight request to prevent race conditions.

* **Returns:** `request(options)` *(Function)*

  * **Parameters:** `options` *(Object)*
    * `url` *(String)* — Target URL
    * `method` *(String)* — HTTP method (default: `'GET'`)
    * `body` *(Object|String)* — Request body (Objects are automatically stringified)
    * `loading` *(Function)* — Receives boolean (true) on start and (false) on completion/failure.
    * `response` *(Function)* — Custom response parser (default: `res => res.json()`). Useful for `res.text()`, `res.blob()`, etc.
    * `success` *(Function)* — Callback on success `(data) => {}`
    * `error` *(Function)* — Callback on HTTP, GraphQL, or network error `(err) => {}`

---

## 🎯 Why Flynt.js?

Modern frontend tooling often forces a tough choice: write verbose Vanilla JS DOM manipulations, bloat your markup with inline logic (`x-data="{ ... }"`), or drag in hundreds of kilobytes of SPA framework overhead.

Flynt.js takes a different path: **Keep HTML clean, keep code structured, keep bundles microscopic.**

| Feature                | Flynt.js                         | Alpine.js                   | React / Vue     |
| :--------------------- | :------------------------------- | :-------------------------- | :-------------- |
| **Bundle Size**        | **~2.2 KB minified**             | ~15 KB                      | ~40–130 KB      |
| **HTML Markup**        | **100% Clean** (`data-fx="..."`) | Inline (`x-data`, `x-init`) | JSX / Templates |
| **DOM Reconciliation** | **Keyed Native Diffing**         | Full node morphing          | Virtual DOM     |
| **Build Step**         | **None required**                | None required               | Required        |
| **Architecture**       | **Presenter Closures**           | Inline Directives           | Component Trees |

---

## 🚀 Key Features

- 📦 **Microscopic Footprint:** Under 2.2KB gzipped. Zero dependencies.
- 🧹 **Clean HTML:** Zero JavaScript logic inside your markup — just clean, declarative `data-fx` attributes.
- 🔄 **Fine-Grained Reactivity:** Automatic dependency tracking using native JS getters and setters.
- ⚡ **Microtask Batching:** Multiple state mutations are batched into a single render frame for maximum performance.
- 🧩 **Keyed List Reconciliation:** Built-in `map()` helper for $O(1)$ lookup and in-place DOM updates for dynamic arrays.
- 🧠 **Zero Magic:** ~165 lines of clean JS that any developer can inspect and master in 10 minutes.


## ⚙️ The Mechanics

### How state works
Flynt.js uses **Fine-Grained Microtask Reactivity** powered by native JavaScript `Object.defineProperty` getters and setters.

```
State Change  ──>  Dependency Tracking  ──>  Microtask Batching  ──>  DOM Render
```

* **Getter-Based Dependency Tracking:** When a property inside your `createState` object is read inside a `render()` block, Flynt.js automatically registers that property as a dependency.
* **Microtask Batching:** Multiple state mutations in the same execution cycle (e.g., updating `state.count` and `state.name` right after each other) are batched together via `queueMicrotask()`. Your DOM updates only **once** per cycle.
* **No Virtual DOM:** Flynt.js mutates the actual DOM directly where needed—giving you raw browser performance with zero abstraction overhead.

#### Function Updates
You can update state directly or pass a function to derive the new value based on the previous state:

```javascript
// Direct update
state.count = 5;

// Function update (receives current value)
state.count = (prev) => prev + 1;
```
#### Array Updates
> ⚠️ **Note:** Array properties in your state must be updated **immutably**! Mutating an array directly (e.g., via `push`, `pop`, or `splice`) will not trigger a reactivity re-render. Always assign a fresh array instance:

```javascript
// ❌ Don't mutate directly
state.items.push(newItem); 

// ✅ Update immutably with spread syntax
state.items = [...state.items, newItem];

// ✅ Or filter/map immutably
state.items = state.items.filter(item => item.id !== targetId);
```


### How DOM Binding Works (`data-fx`)

Flynt.js bridges your JavaScript presenters to the HTML DOM using the `data-fx` attribute. When the page loads, Flynt automatically scans the document, resolves the method path on `window`, and passes the matched DOM element directly to your presenter function.

```html
<!-- HTML -->
<div data-fx="productPresenter.productListing"></div>
// JavaScript
window.productPresenter = fx.presenter(({ createState, render }) => {
  return {
    // Flynt executes this automatically and passes the <div> element as 'el'
    productListing(el) {
      render(() => {
        el.textContent = "Bound and reactive!";
      });
    }
  };
});
```

* Zero Config Scanning: No manual document.querySelector or initialization calls required.

* Nested Path Resolution: Dot notation is fully supported (e.g., data-fx="shop.catalog.productPresenter.item").

* Explicit Errors: If a specified path or method doesn't exist on window, Flynt immediately throws a clear console error to speed up debugging.



## ⚡ Real-World Example: Master-Detail List with Pagination

Flynt.js effortlessly handles complex asynchronous workflows, nested reactivity, state-driven UI disabled modifiers, and keyed DOM updates.

```html
<main>
  <ul data-fx="productPresenter.productListing"></ul>

  <button
    data-fx="productPresenter.loadMoreBtn"
    class="btn disabled:opacity-50 disabled:cursor-not-allowed"
  >
    Load More
  </button>
</main>

<script>
  window.productPresenter = fx.presenter(({ createState, render, map }) => {
    const state = createState({
      loading: false,
      products: [],
      page: { skip: 0, limit: 10 },
      selectedProduct: undefined,
    });

    const getProducts = async (skip = 0) => {
      state.loading = true;
      try {
        const res = await fetch(
          `https://dummyjson.com/products?limit=10&skip=${skip}`,
        );
        const data = await res.json();
        state.products = [...state.products, ...(data?.products || [])];
      } finally {
        state.loading = false;
      }
    };

    // Reactive Effect: Fetch data whenever page.skip changes
    render(async () => {
      await getProducts(state.page.skip);
    });

    return {
      loadMoreBtn(el) {
        el.onclick = () => (state.page.skip += 10);
        render(() => {
          el.disabled = state.loading;
        });
      },
      productListing(el) {
        const mapProducts = map(el);

        el.onclick = (evt) => {
          const id = evt.target.closest("li")?.dataset.productId;
          if (id) state.selectedProduct = Number(id);
        };

        render(() => {
          const items = state.products.map((prod) => ({
            key: prod.id,
            html: `<li class="${prod.id === state.selectedProduct ? "active" : ""}" data-product-id="${prod.id}">${prod.title}</li>`,
          }));

          // Fast, in-place keyed DOM diffing
          mapProducts(items);
        });
      },
    };
  });
</script>
```

## ⚖️ License
MIT © Marcel Bos

Distributed under the MIT License. Free for commercial and non-commercial use.
