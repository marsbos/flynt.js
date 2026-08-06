window.fx = {
  presenter(cb) {
    let activeEffect = null;
    let pendingStateUpdates = false;

    const queue = new Set();
    // Batching
    const _batch = (pathSubscribers) => {
      pathSubscribers.forEach((subscriber) => queue.add(subscriber));

      if (!pendingStateUpdates) {
        pendingStateUpdates = true;

        queueMicrotask(() => {
          while (queue.size > 0) {
            const currentQueue = Array.from(queue);
            queue.clear();
            for (const sub of currentQueue) {
              sub?.();
            }
          }
          pendingStateUpdates = false;
        });
      }
    };

    // State util
    const _createState = (obj) => {
      const descriptors = Object.getOwnPropertyDescriptors(obj);

      Object.keys(descriptors).forEach((key) => {
        const descriptor = descriptors[key];
        let value = descriptor.value;
        const subscribers = new Set();

        const makeNestedState = (v) => {
          if (v !== null && typeof v === "object" && !Array.isArray(v)) {
            _createState(v);
          }
        };
        makeNestedState(value);

        Object.defineProperty(obj, key, {
          configurable: true,
          enumerable: true,
          get() {
            if (descriptor.get) {
              return descriptor.get.call(obj);
            }
            if (activeEffect) {
              subscribers.add(activeEffect);
            }
            return value;
          },
          set(v) {
            let newValue = v;
            if (typeof v == "function") {
              newValue = v(value);
            }
            if (value !== newValue) {
              makeNestedState(newValue);
              value = newValue;
              _batch(subscribers);
            }
          },
        });
      });

      return obj;
    };

    // Render/effect tracking
    const _render = (fn) => {
      const update = () => {
        activeEffect = update;
        fn();
        activeEffect = null;
      };
      update();
    };
    // Debounce utility
    const _debounce = (fn, ms) => {
      let timerId = undefined;
      return (...args) => {
        if (timerId) clearTimeout(timerId);
        timerId = setTimeout(() => {
          fn(...args);
        }, ms);
      };
    };

    // Array map utility
    const _mapHoc = (element) => {
      const currentItems = new Map();
      return (items) => {
        if (!Array.isArray(items)) return;
        const newKeys = new Set(items.map((itm) => itm.key));
        for (const [key, node] of currentItems) {
          if (!newKeys.has(key)) {
            node.remove();
            currentItems.delete(key);
          }
        }
        let nextNode = element.firstChild;
        items.forEach((itm) => {
          const key = itm.key;
          let node = currentItems.get(key);
          if (!node) {
            const itmHTML = itm.html;

            element.insertAdjacentHTML("beforeend", itmHTML);
            node = element.lastElementChild;
            if (!node) {
              throw new Error("Could not make array-item child node!");
            }

            currentItems.set(key, node);
          }
          if (!node.isConnected || node !== nextNode) {
            element.insertBefore(node, nextNode);
          } else {
            // existing node
            if (node.outerHTML?.trim() !== itm.html?.trim()) {
              const template = document.createElement("template");
              template.innerHTML = itm.html;
              const newNode = template.content.firstElementChild;
              node.replaceWith(newNode);
              currentItems.set(key, newNode);
              node = newNode;
            }
          }
          nextNode = node.nextSibling;
        });
      };
    };
    const _fetchHelper = () => {
      let ctrl;
      return async ({
        url,
        method,
        body,
        headers,
        success,
        error,
        response,
        loading,
      }) => {
        ctrl?.abort();
        ctrl = new AbortController();
        try {
          loading?.(true);
          const res = await fetch(url, {
            method: method ?? "GET",
            headers: {
              ...(body && { "Content-Type": "application/json" }),
              ...headers,
            },
            ...(body && {
              body: typeof body === "object" ? JSON.stringify(body) : body,
            }),
            signal: ctrl.signal,
          });

          if (!res.ok) {
            return error({
              status: res.status,
              message: res.statusText,
            });
          }

          const parseFn =
            typeof response === "function" ? response : (r) => r.json();
          const data = await parseFn(res);

          if (data?.errors) {
            return error?.(data.errors);
          }

          success?.(data);
        } catch (e) {
          if (e?.name !== "AbortError") {
            return error?.(e);
          }
        } finally {
          if (!ctrl.signal.aborted) loading?.(false);
        }
      };
    };

    // Create the presenter
    return cb({
      createState: _createState,
      debounce: _debounce,
      render: _render,
      map: _mapHoc,
      request: _fetchHelper,
    });
  },
};

const _scanOnReady = () => {
  Array.from(document.querySelectorAll("[data-fx]")).forEach((el) => {
    const [p, ...rest] = el.dataset.fx?.split(".") ?? [];
    const prApi = window[p];

    const presenter = rest.reduce((memo, curr) => {
      const k = memo[curr];
      if (!k) {
        throw new Error(`No presenter found for '${curr}'!`);
      }
      return k;
    }, prApi || {});

    if (typeof presenter === "function") {
      presenter(el);
    }
  });
};

if (document.readyState !== "loading") {
  _scanOnReady();
} else {
  document.addEventListener("DOMContentLoaded", _scanOnReady, { once: true });
}
