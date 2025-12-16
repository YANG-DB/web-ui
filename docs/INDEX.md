# Documentation Index

This directory contains comprehensive documentation for the web-ui application.

## 📖 Main Documentation

### Getting Started
- **[Main README](../README.md)** - Project overview, quick start, and feature summary
- **[Quick Reference](QUICK_REFERENCE.md)** - Cheat sheet for common tasks and queries

### Feature Documentation
- **[Visual Query Builder](VISUAL_QUERY_BUILDER.md)** - Complete guide to building visual queries
- **[Schema Viewer](SCHEMA_VIEWER.md)** - GraphQL schema management and ontology structure
- **[Features Summary](FEATURES_SUMMARY.md)** - Detailed overview of all recent features

### Technical Documentation
- **[Relationship Patterns](../RELATIONSHIP_PATTERNS.md)** - Understanding ontology relationships
- **[GitHub Actions Setup](../GITHUB_ACTIONS_SETUP.md)** - CI/CD configuration
- **[Workflows Summary](../WORKFLOWS_SUMMARY.md)** - Automation workflows

---

## 🖼️ Screenshots

All screenshots are located in the [`images/`](images/) directory.

**Screenshot Guide**: [images/README.md](images/README.md)

### Required Screenshots

#### Visual Query Builder
- [ ] visual-query-builder.png
- [ ] ontology-selector.png
- [ ] query-entity-selection.png
- [ ] query-relationship-operators.png
- [ ] query-property-filters.png
- [ ] query-expansion-before.png
- [ ] query-expansion-after.png
- [ ] query-preview.png
- [ ] query-nested-groups.png
- [ ] query-multi-level.png

#### Schema Viewer
- [ ] schema-viewer.png
- [ ] schema-ontology-selector.png
- [ ] schema-graphql-view.png
- [ ] schema-dragons-ontology.png
- [ ] schema-linkedin-ontology.png
- [ ] schema-actions.png
- [ ] schema-loading.png

#### Existing
- [x] dashboard-overview.png

---

## 🗂️ Documentation by Topic

### For Users

**I want to...**
- Build a query → [Visual Query Builder](VISUAL_QUERY_BUILDER.md)
- View schema → [Schema Viewer](SCHEMA_VIEWER.md)
- Quick reference → [Quick Reference](QUICK_REFERENCE.md)
- Understand features → [Features Summary](FEATURES_SUMMARY.md)

### For Developers

**I want to...**
- Understand architecture → [Main README](../README.md#application-architecture)
- Add features → [Features Summary](FEATURES_SUMMARY.md#-file-structure)
- Set up CI/CD → [GitHub Actions Setup](../GITHUB_ACTIONS_SETUP.md)
- Work with ontologies → [Relationship Patterns](../RELATIONSHIP_PATTERNS.md)

### For Testers

**I want to...**
- Test query builder → [Visual Query Builder](VISUAL_QUERY_BUILDER.md#troubleshooting)
- Test schema viewer → [Schema Viewer](SCHEMA_VIEWER.md#troubleshooting)
- Check features → [Features Summary](FEATURES_SUMMARY.md#-testing-checklist)

---

## 📝 Documentation Standards

When creating or updating documentation:

### File Naming
- Use SCREAMING_SNAKE_CASE for markdown files (e.g., `VISUAL_QUERY_BUILDER.md`)
- Use kebab-case for images (e.g., `query-builder-overview.png`)

### Structure
1. **Title** - Clear, descriptive H1
2. **Introduction** - Brief overview
3. **Features** - Detailed sections with H2/H3
4. **Examples** - Code snippets and use cases
5. **Troubleshooting** - Common issues and solutions
6. **Related Links** - Links to other docs

### Markdown Style
- Use relative links for internal references
- Include code blocks with language specifiers
- Add screenshots with descriptive alt text
- Use tables for structured data
- Include annotations on screenshots

### Images
- Store in `docs/images/`
- Reference as `![Alt Text](images/filename.png)`
- Keep file size under 500KB
- Use PNG for UI, JPG for photos

---

## 🔄 Documentation Workflow

### Adding New Features

1. **Plan documentation** before coding
2. **Write docs** alongside code
3. **Add screenshots** after implementation
4. **Update index** and related docs
5. **Review** for accuracy and clarity

### Updating Existing Docs

1. **Identify changes** - What's different?
2. **Update affected docs** - All relevant files
3. **Check cross-references** - Update links
4. **Verify screenshots** - Still accurate?
5. **Test examples** - Do they still work?

---

## 📊 Documentation Coverage

| Feature | User Guide | Dev Guide | Screenshots |
|---------|-----------|-----------|-------------|
| Query Builder | ✅ | ✅ | ⏳ Pending |
| Schema Viewer | ✅ | ✅ | ⏳ Pending |
| Ontology Selection | ✅ | ✅ | ⏳ Pending |
| Relationship Expansion | ✅ | ✅ | ⏳ Pending |
| Query Preview | ✅ | ✅ | ⏳ Pending |
| Multi-Ontology | ✅ | ✅ | ⏳ Pending |

**Legend**: ✅ Complete | ⏳ In Progress | ❌ Missing

---

## 🎯 Quick Links

### User Documentation
- [How to build a query](VISUAL_QUERY_BUILDER.md#building-queries)
- [How to expand relationships](VISUAL_QUERY_BUILDER.md#relationship-expansion)
- [How to view schema](SCHEMA_VIEWER.md#graphql-schema-display)
- [How to switch ontologies](VISUAL_QUERY_BUILDER.md#ontology-selection)

### Developer Documentation
- [File structure](FEATURES_SUMMARY.md#-file-structure)
- [Design decisions](FEATURES_SUMMARY.md#-design-decisions)
- [API endpoints](QUICK_REFERENCE.md#api-endpoints-reference)
- [Component architecture](FEATURES_SUMMARY.md#technical-improvements)

### Troubleshooting
- [Query builder issues](VISUAL_QUERY_BUILDER.md#troubleshooting)
- [Schema viewer issues](SCHEMA_VIEWER.md#troubleshooting)
- [Common problems](QUICK_REFERENCE.md#troubleshooting-quick-fixes)

---

## 💡 Contributing to Docs

We welcome documentation improvements! Please:

1. **Follow existing style** - Match formatting and tone
2. **Add screenshots** - Visual aids are helpful
3. **Test examples** - Ensure code works
4. **Update index** - Keep this file current
5. **Link properly** - Use relative paths

### Documentation TODOs

- [ ] Capture all required screenshots
- [ ] Add video tutorials
- [ ] Create interactive examples
- [ ] Add API reference documentation
- [ ] Expand troubleshooting sections
- [ ] Add performance tuning guide
- [ ] Create deployment guide

---

## 📞 Need Help?

- Check [Quick Reference](QUICK_REFERENCE.md) for common tasks
- Search existing issues on GitHub
- Consult [Features Summary](FEATURES_SUMMARY.md) for technical details
- Review [troubleshooting sections](#troubleshooting) in feature docs

---

**Last Updated**: 2025-12-16
