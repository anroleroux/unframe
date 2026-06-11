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
    //online-start
    try {
        const userId = getCurrentUserId();
        const headers = userId ? { "X-User-Id": userId } : {};
        const response = await fetch(`/api/categories/${id}`, { method: "DELETE", headers });
        if (!response.ok) throw new Error("Failed to delete category");
    } catch (err) {
        alert("Could not delete category.");
        return;
    }
    //online-end
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

    //online-start
    try {
        const userId = getCurrentUserId();
        const headers = { "Content-Type": "application/json" };
        if (userId) headers["X-User-Id"] = userId;
        const response = await fetch("/api/categories", {
            method: "POST",
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to save category");
        const saved = await response.json();
        data.id = saved.id;
    } catch (err) {
        alert("Could not save category.");
        return;
    }
    //online-end
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

    //online-start
    try {
        const userId = getCurrentUserId();
        const headers = { "Content-Type": "application/json" };
        if (userId) headers["X-User-Id"] = userId;
        const response = await fetch(`/api/categories/${updated.id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(updated),
        });
        if (!response.ok) throw new Error("Failed to update category");
    } catch (err) {
        alert("Could not update category.");
        return;
    }
    //online-end
    const idx = categories.list.findIndex(c => c.id === updated.id);
    if (idx !== -1) categories.list[idx] = updated;
    saveLocal("categories", categories.list);
    categories.editing = null;
}

async function loadCategories() {
    //online-start
    try {
        const userId = getCurrentUserId();
        const headers = userId ? { "X-User-Id": userId } : {};
        const response = await fetch("/api/categories", { headers });
        if (!response.ok) throw new Error("Failed to fetch categories");
        categories.list = await response.json();
        return;
    } catch (error) {
        document.getElementById("categories-list").innerHTML = "<p>Could not load categories.</p>";
        return;
    }
    //online-end
    categories.list = loadLocal("categories");
}
