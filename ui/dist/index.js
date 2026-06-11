const USER_STORAGE_KEY = "currentUserId";

function getCurrentUserId() {
  return localStorage.getItem(USER_STORAGE_KEY) || "";
}

function setCurrentUserId(userId) {
  if (!userId) {
    return;
  }
  localStorage.setItem(USER_STORAGE_KEY, userId);
}

// ── Local data persistence ────────────────────────────────────────────
// Built with `make uidev`, the //online-start … //online-end blocks that
// talk to a back-end are stripped out, and these helpers become the app's
// only data store. Each model persists under its own global name
// ('products', 'categories', …) so state survives a page reload. Start the
// app empty and add your own records — they are remembered in the browser.

function loadLocal(key) {
  try {
    return JSON.parse(localStorage.getItem("data-" + key)) || [];
  } catch {
    return [];
  }
}

function saveLocal(key, list) {
  localStorage.setItem("data-" + key, JSON.stringify(list));
}

function nextLocalId(list) {
  return list.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;
}

function showPage(name) {
    document.querySelectorAll('main > section').forEach(s => s.hidden = true);
    document.getElementById('page-' + name).hidden = false;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('nav-btn--active'));
    document.getElementById('nav-' + name).classList.add('nav-btn--active');
}

function reactive(obj, onChange) {
    return new Proxy(obj, {
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);

            if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
                return value;
            }
            
            if (typeof value === 'object' && value !== null)
                return reactive(value, onChange);
            return value;
        },
        set(target, prop, value, receiver) {
            const result = Reflect.set(target, prop, value, receiver);
            if (prop !== "_draft") {
                onChange();
            }
            return result;
        },
        deleteProperty(target, prop) {
            const result = Reflect.deleteProperty(target, prop);
            onChange();
            return result;
        }
    });
}

function mount(root, state, template) {
    function bindEditableInputs() {
        document.querySelectorAll("input[id^='input-']").forEach(input => {
            input.oninput = e => {
                const [ , nindex, field ] = input.id.split("-");
                networks[nindex]._draft = e.target.value;
            };
            input.focus();
        });
    }

    function render() {
        root.innerHTML = template(state);
        bindEditableInputs();
    }
    
    const r = reactive(state, render);
    render();
    return r;
}

// Renders a display row (label + value + edit button) or, when this field is
// being edited, an edit row (label + input/select + Save/Cancel buttons).
// mountRef  — global variable name of the reactive mount object, e.g. 'products'
// apiPath   — base API path for PATCH, e.g. '/api/products'
// label     — human-readable field label shown above the input
// fieldKey  — property name on the selected item, e.g. 'name', 'price'
// display   — formatted string shown in display mode, e.g. '$3.49'
// inputType — 'text' | 'number' | 'select'
// options   — required when inputType === 'select': [{value, label}, ...]
function editableField(mountRef, apiPath, label, fieldKey, display, inputType, options) {
    const mount = window[mountRef];
    if (mount.editing_field === fieldKey) {
        const control = inputType === 'select'
            ? `<select class="editable-field__input" onchange="${mountRef}._draft=this.value">
                   ${options.map(o => `<option value="${o.value}"${o.value == mount._draft ? ' selected' : ''}>${o.label}</option>`).join('')}
               </select>`
            : `<input class="editable-field__input" type="${inputType}" value="${mount._draft ?? ''}" oninput="${mountRef}._draft=this.value"${inputType === 'number' ? ' step="any" min="0"' : ''}>`;
        return `
            <div class="editable-field editable-field--editing">
                <label class="editable-field__label">${label}</label>
                ${control}
                <div class="editable-field__btns">
                    <button class="save-field-btn" type="button" onclick="saveField('${mountRef}','${fieldKey}','${apiPath}','${inputType}')">Save</button>
                    <button class="cancel-field-btn" type="button" onclick="cancelEdit('${mountRef}')">Cancel</button>
                </div>
            </div>`;
    }
    return `
        <div class="editable-field">
            <label class="editable-field__label">${label}</label>
            <span class="editable-field__value">${display}</span>
            <button class="edit-field-btn" type="button" onclick="beginEdit('${mountRef}','${fieldKey}')">&#9998;</button>
        </div>`;
}

// Seeds _draft with the current field value (no re-render) then sets
// editing_field (triggers one re-render that switches the field to edit mode).
// mountRef — global variable name of the reactive mount object
// fieldKey — property name on the selected item to begin editing
function beginEdit(mountRef, fieldKey) {
    const mount = window[mountRef];
    mount._draft = mount.selected[fieldKey];
    mount.editing_field = fieldKey;
}

// Clears editing_field, reverting the active field back to display mode.
// mountRef — global variable name of the reactive mount object
function cancelEdit(mountRef) {
    window[mountRef].editing_field = null;
}

// Reads _draft, type-converts it based on inputType, PATCHes the API (online
// builds only), writes the value back to the selected item, persists the list
// locally, and clears editing_field.
// mountRef  — global variable name of the reactive mount object
// fieldKey  — property name on the selected item being saved
// apiPath   — base API path; request goes to apiPath/selected.id
// inputType — 'text' | 'number' | 'select'; controls type conversion of _draft
function saveField(mountRef, fieldKey, apiPath, inputType) {
    const mount = window[mountRef];
    let val = mount._draft;
    if (inputType === 'number') val = parseFloat(val) || 0;
    if (inputType === 'select') val = parseInt(val, 10);


    mount.selected[fieldKey] = val;
    saveLocal(mountRef, mount.list);
    mount.editing_field = null;
}

function productsTemplate(state) {
    const productTemplate = (p) => {
        const mr = 'products', api = '/api/products';
        return `
        <div class="product-card product-card--detail">
            <div class="product-card__header">
                <span class="product-card__category">${categoryName(p.category_id)}</span>
                <button class="back-btn" type="button" onclick="products.selected=null;products.editing_field=null">&#8592; Back</button>
            </div>
            <div class="product-card__fields">
                ${editableField(mr, api, 'Name',        'name',        p.name,                      'text')}
                ${editableField(mr, api, 'Category',    'category_id', categoryName(p.category_id), 'select', categories.list.map(c => ({value: c.id, label: c.name})))}
                ${editableField(mr, api, 'Price',       'price',       '$' + p.price.toFixed(2),    'number')}
                ${editableField(mr, api, 'Stock',       'stock',       String(p.stock),             'number')}
                ${editableField(mr, api, 'Description', 'description', p.description,              'text')}
            </div>
            <div class="product-card__actions">
                <button class="delete-btn" type="button" onclick="deleteProduct(products.selected)">Delete</button>
            </div>
        </div>
        `;
    };

    const addFormTemplate = () => `
        <form class="product-card product-card--detail" onsubmit="saveProduct(event)">
            <div class="product-card__header">
                <span class="product-card__category">New product</span>
                <button class="back-btn" type="button" onclick="products.adding=false">&#8592; Cancel</button>
            </div>
            <div class="add-form">
                <div class="add-form__field">
                    <label>Name</label>
                    <input name="name" type="text" required>
                </div>
                <div class="add-form__field">
                    <label>Category</label>
                    <select name="category_id" required>
                        <option value="">Select a category</option>
                        ${categories.list.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}
                    </select>
                </div>
                <div class="add-form__field add-form__field--row">
                    <div class="add-form__field">
                        <label>Price</label>
                        <input name="price" type="number" step="0.01" min="0" required>
                    </div>
                    <div class="add-form__field">
                        <label>Stock</label>
                        <input name="stock" type="number" min="0" required>
                    </div>
                </div>
                <div class="add-form__field">
                    <label>Description</label>
                    <textarea name="description"></textarea>
                </div>
            </div>
            <div class="product-card__actions">
                <button class="start-btn" type="submit">Save</button>
            </div>
        </form>
    `;

    const rowTemplate = (p, pid) => `
        <div class="item-row" onclick="selectProduct(${pid})">
            <div class="item-row__main">
                <span class="item-row__name">${p.name}</span>
                <span class="item-row__category">${categoryName(p.category_id)}</span>
            </div>
            <div class="item-row__meta">
                <span class="item-row__price">$${p.price.toFixed(2)}</span>
                <span class="item-row__stock ${p.stock > 0 ? 'in-stock' : 'out-stock'}">${p.stock > 0 ? 'In stock' : 'Out of stock'}</span>
            </div>
        </div>
    `;

    if (state.selected) return productTemplate(state.selected);
    if (state.adding)   return addFormTemplate();
    return `
        <div class="items-toolbar">
            <button class="start-btn" type="button" onclick="products.adding=true">+ Add product</button>
        </div>
        ${state.list.map((sp, spid) => rowTemplate(sp, spid)).join("")}
    `;
}

var products = mount(
    document.getElementById("products-list"),
    {list: [], selected: null, adding: false, editing_field: null},
    productsTemplate
);

function selectProduct(pid) {
    products.selected = products.list[pid];
}

async function deleteProduct(p) {
    const idx = products.list.findIndex(item => item.id === p.id);
    if (idx !== -1) products.list.splice(idx, 1);
    saveLocal("products", products.list);
    products.editing_field = null;
    products.selected = null;
}

async function saveProduct(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
        name:        fd.get("name"),
        category_id: parseInt(fd.get("category_id"), 10),
        price:       parseFloat(fd.get("price")),
        stock:       parseInt(fd.get("stock"), 10),
        description: fd.get("description") || "",
    };

    if (!data.id) data.id = nextLocalId(products.list);
    products.list.push(data);
    saveLocal("products", products.list);
    products.adding = false;
}

async function loadProducts() {
    products.list = loadLocal("products");
}

function categoriesTemplate(state) {
    const addFormTemplate = () => `
        <form class="product-card product-card--detail" onsubmit="saveCategory(event)">
            <div class="product-card__header">
                <span class="product-card__category">New category</span>
                <button class="back-btn" type="button" onclick="categories.adding=false">&#8592; Cancel</button>
            </div>
            <div class="add-form">
                <div class="add-form__field">
                    <label>Name</label>
                    <input name="name" type="text" required>
                </div>
                <div class="add-form__field">
                    <label>Description</label>
                    <textarea name="description"></textarea>
                </div>
            </div>
            <div class="product-card__actions">
                <button class="start-btn" type="submit">Save</button>
            </div>
        </form>
    `;

    const editFormTemplate = (c) => `
        <form class="product-card product-card--detail" onsubmit="updateCategory(event)">
            <div class="product-card__header">
                <span class="product-card__category">Edit category</span>
                <button class="back-btn" type="button" onclick="categories.editing=null">&#8592; Cancel</button>
            </div>
            <div class="add-form">
                <div class="add-form__field">
                    <label>Name</label>
                    <input name="name" type="text" value="${c.name}" required>
                </div>
                <div class="add-form__field">
                    <label>Description</label>
                    <textarea name="description">${c.description || ''}</textarea>
                </div>
            </div>
            <div class="product-card__actions">
                <button class="start-btn" type="submit">Update</button>
            </div>
        </form>
    `;

    const rowTemplate = (c) => `
        <div class="item-row">
            <div class="item-row__main">
                <span class="item-row__name">${c.name}</span>
                <span class="item-row__category">${c.description || ''}</span>
            </div>
            <div class="row-actions">
                <button class="edit-btn" type="button" onclick="editCategory(${c.id})">Edit</button>
                <button class="delete-btn" type="button" onclick="deleteCategory(${c.id})">Delete</button>
            </div>
        </div>
    `;

    if (state.adding)  return addFormTemplate();
    if (state.editing) return editFormTemplate(state.editing);
    return `
        <div class="items-toolbar">
            <button class="start-btn" type="button" onclick="categories.adding=true">+ Add category</button>
        </div>
        ${state.list.map((c) => rowTemplate(c)).join("")}
    `;
}

var categories = mount(
    document.getElementById("categories-list"),
    {list: [], adding: false, editing: null},
    categoriesTemplate
);

function editCategory(id) {
    categories.editing = categories.list.find(c => c.id === id);
}

function categoryName(id) {
    const c = categories.list.find(c => c.id === id);
    return c ? c.name : '—';
}

async function deleteCategory(id) {
    const idx = categories.list.findIndex(c => c.id === id);
    if (idx !== -1) categories.list.splice(idx, 1);
    saveLocal("categories", categories.list);
}

async function saveCategory(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
        name:        fd.get("name"),
        description: fd.get("description") || "",
    };

    if (!data.id) data.id = nextLocalId(categories.list);
    categories.list.push(data);
    saveLocal("categories", categories.list);
    categories.adding = false;
}

async function updateCategory(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const updated = {
        id:          categories.editing.id,
        name:        fd.get("name"),
        description: fd.get("description") || "",
    };

    const idx = categories.list.findIndex(c => c.id === updated.id);
    if (idx !== -1) categories.list[idx] = updated;
    saveLocal("categories", categories.list);
    categories.editing = null;
}

async function loadCategories() {
    categories.list = loadLocal("categories");
}

document.addEventListener("DOMContentLoaded", () => {
  setCurrentUserId(1);
  loadCategories();
  loadProducts();
});
