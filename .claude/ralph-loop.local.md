---
active: true
iteration: 6
max_iterations: 10
completion_promise: null
started_at: "2026-01-06T17:30:00Z"
---

## Current Mission: UI Design Quality Enhancement

Use the `/frontend-design` skill to elevate UI quality across the application. Focus on creating distinctive, memorable interfaces that avoid generic AI aesthetics.

### Priority Areas
1. **Dashboard redesign** - Make it visually striking and memorable
2. **Data visualization** - Elevate chart aesthetics
3. **Component polish** - Buttons, cards, modals with distinctive character
4. **Typography & spacing** - Professional, refined choices
5. **Micro-interactions** - Meaningful animations and transitions

### Technical Guidelines
- Use Tailwind CSS for styling
- Use Framer Motion for animations (already installed)
- Maintain React 18 + TypeScript patterns
- Keep accessibility in mind (WCAG compliance)

### ⚠️ CRITICAL: Zombie Process Prevention

**NEVER run `pnpm test` in watch mode!** Always use:
- `pnpm run test:run` (includes auto-cleanup)
- `pnpm run test:unit` (includes auto-cleanup)

If tests hang or you suspect zombie processes:
```bash
pnpm run cleanup:test
# or manually: pkill -f 'vitest'
```

The vitest config has been updated with `pool: 'forks'` and `maxWorkers: 4` to prevent zombie processes, but always be cautious.

### Workflow
1. Pick a component/page to enhance
2. Use `/frontend-design` for design guidance
3. Implement improvements
4. Test changes work (use test:run, NOT test)
5. Commit after each logical unit
6. Move to next component

Do not forget to commit at every stage. Keep working until UI reaches production-level quality.
