// ===== CATEGORIES =====
let _categories = [];

const Categories = {
  async load() {
    try {
      _categories = await Api.getCategories(Api.getUserId());
      Categories.render();
    } catch (e) { console.error(e); }
  },

  render() {
    const el = document.getElementById('category-list');
    if (!_categories.length) {
      el.innerHTML = '<span style="color:var(--gray-400);font-size:13px">No categories yet</span>';
      return;
    }
    el.innerHTML = _categories.map(c => `
      <div class="category-tag">
        ${c.name}
        <button onclick="Categories.delete(${c.categoryId})" title="Delete">✕</button>
      </div>`).join('');
  },

  async delete(id) {
    if (!confirm('Delete this category?')) return;
    try {
      await Api.deleteCategory(id);
      await Categories.load();
    } catch (e) { alert('Error: ' + e.message); }
  },

  init() {
    document.getElementById('category-form').onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById('new-category').value.trim();
      if (!name) return;
      try {
        await Api.createCategory({ name, userId: Api.getUserId() });
        document.getElementById('new-category').value = '';
        await Categories.load();
      } catch (err) { alert('Error: ' + err.message); }
    };
  },

  // Populate a <select> with categories
  populateSelect(selectId) {
    const sel = document.getElementById(selectId);
    sel.innerHTML = _categories.map(c =>
      `<option value="${c.categoryId}">${c.name}</option>`
    ).join('');
    if (!_categories.length) {
      sel.innerHTML = '<option value="">No categories — add one in Profile</option>';
    }
  },

  getAll: () => _categories,
};
