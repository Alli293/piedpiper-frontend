import { Directive } from '@angular/core';

/**
 * Inline text link styling for `<a>` elements used within paragraph copy.
 * For an action that isn't real navigation, use `app-button` with `variant="link"` instead —
 * it renders a `<button>` so assistive tech announces it correctly.
 */
@Directive({
  selector: 'a[appLink]',
  host: {
    class: 'ch-link',
  },
})
export class LinkDirective {}
