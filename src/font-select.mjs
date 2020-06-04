/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// @license © 2020 Google LLC. Licensed under the Apache License, Version 2.0.

// See https://html.spec.whatwg.org/multipage/common-dom-interfaces.html ↵
// #reflecting-content-attributes-in-idl-attributes.
const installStringReflection = (obj, attrName, propName = attrName) => {
  Object.defineProperty(obj, propName, {
    enumerable: true,
    get() {
      const value = this.getAttribute(attrName);
      return value === null ? '' : value;
    },
    set(v) {
      this.setAttribute(attrName, v);
    },
  });
};

const installBoolReflection = (obj, attrName, propName = attrName) => {
  Object.defineProperty(obj, propName, {
    enumerable: true,
    get() {
      return this.hasAttribute(attrName);
    },
    set(v) {
      if (v) {
        this.setAttribute(attrName, '');
      } else {
        this.removeAttribute(attrName);
      }
    },
  });
};

const DEBUG = false;

// Observed attributes
const AUTOFOCUS = 'autofocus';
const MULTIPLE = 'multiple';
const VALUE = 'value';
const DISABLED = 'disabled';

// UI strings
const REGULAR = 'Regular';
const FONT_FAMILY = 'Font Family';
const FONT_FAMILIES = 'Font Families';

// Other strings
const LI = 'li';
const DETAILS = 'details';
const SUMMARY = 'summary';
const UL = 'ul';
const BUTTON = 'button';
const INPUT = 'input';
const HIGHLIGHT = 'highlight';
const OPTION = 'option';
const FAMILY = 'family';
const VARIATION = 'variation';
const CHANGE = 'change';
const GRANTED = 'granted';
const LOCAL_FONTS = 'local-fonts';
const NONE = 'none';
const BLOCK = 'block';
const TYPE_ERROR = 'TypeError';
const KEY_DOWN = 'keydown';
const ARIA_EXPANDED = 'aria-expanded';
const ARIA_SELECTED = 'aria-selected';
const ARIA_ACTIVEDESCENDENT = 'aria-activedescendant';

// Keys
const ARROW_DOWN = 'ArrowDown';
const ARROW_UP = 'ArrowUp';
const ARROW_LEFT = 'ArrowLeft';
const ARROW_RIGHT = 'ArrowRight';
const ESCAPE = 'Escape';
const ENTER = 'Enter';
const NUMPAD_ENTER = 'NumpadEnter';

// Uglify
const DOCUMENT = document;
const NAVIGATOR = navigator;
const PERMISSIONS = NAVIGATOR.permissions;

const template = DOCUMENT.createElement('template');
template.innerHTML = `
  <style>
    *,
    ::before,
    ::after {
      box-sizing: border-box;
    }

    :host {
      --input-height: 1.3125em;
      --autocomplete-height: 10em;
      --element-height: calc(var(--input-height) + var(--autocomplete-height));

      height: var(--input-height);
      color-scheme: dark light;
      contain: content;
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    ul {
      color: CanvasText;
      background-color: Canvas;
      position: absolute;
      margin: 0;
      list-style: none;
      padding-inline-start: 0.25em;
      overflow-y: scroll;
      max-height: var(--autocomplete-height);
      border: solid 1px FieldText;
    }

    .variation {
      display: block;
      position: initial;
      overflow-y: initial;
      border: none;
      width: 100%;
      padding-inline-start: 1em;
    }

    li {
      user-select: none;
      cursor: default;
    }

    input,
    button {
      font-size: inherit;
      padding: 0.25rem;
      background-color: Canvas;
      color: CanvasText;
    }

    input {
      height: var(--input-height);
      margin-inline-end: -1px;
      border-radius: 0;
      border-top: 2px inset;
      border-right: none;
      border-bottom: 2px inset;
      border-left: 2px inset;
    }

    button:focus,
    input:focus,
    ul:focus {
      outline: none;
    }

    div[part=wrapper]:focus-within {
      outline: auto 2px -webkit-focus-ring-color;
      outline-offset: -2px;
    }

    button {
      appearance: none;
      border-right: 2px inset;
      border-bottom: 2px inset;
      border-left: none;
      border-top: 2px inset;
      height: var(--input-height);
      width: var(--input-height);
      overflow: hidden;
    }

    input::-webkit-search-cancel-button {
      position:relative;
      right: -0.25em;
      appearance: none;
      width: 0.5em;
      height: 0.5em;
      background-image: url("data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 10 10%22><text text-anchor=%22middle%22 fill=%22GrayText%22 x=%225%22 y=%220.5em%22 font-size=%221em%22>⨯</text></svg>");
      background-size: 0.75em;
      background-position: center;
    }

    button::before {
      content: "▸";
      color: GrayText;
      display: inline-block;
      position: relative;
      top: -0.3em;
    }

    button[aria-expanded=true]::before {
      transform: rotate(-90deg);
    }

    button[aria-expanded=false]::before {
      transform: rotate(90deg);
    }

    div[part=wrapper] {
      display: inline-flex;
      align-items: center;
      margin-inline-end: 0.25em;
    }

    div[part=font-family] {
      display: inline-flex;
      position: absolute;
      align-items: center;
    }

    .highlight {
      background-color: Highlight;
    }
  </style>

  <div part="font-family">
    <div part="wrapper">
      <input part="font-family-input" id="family" type="search" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="autocomplete">
      <button tabindex="-1" aria-label="${FONT_FAMILIES}" aria-expanded="false" aria-controls="autocomplete"></button>
    </div>
    <label part="font-family-label" for="family">${FONT_FAMILY}</label>
  </div>
  <div class="spacer"></div>
  <ul tabindex="-1" part="font-family-preview" id="autocomplete" role="listbox" aria-label="${FONT_FAMILIES}"></ul>`;

export class FontSelect extends HTMLElement {
  static get observedAttributes() {
    return [AUTOFOCUS, MULTIPLE, DISABLED, VALUE];
  }

  constructor() {
    super();

    installBoolReflection(this, DISABLED);
    installBoolReflection(this, MULTIPLE);
    installBoolReflection(this, AUTOFOCUS);
    installStringReflection(this, VALUE);

    this._initializeDOM();
  }

  _log(message, event = '') {
    if (DEBUG) {
      console.log(message, event);
    }
  }

  async _requestPermission() {
    try {
      if (
        (await PERMISSIONS.request({ name: LOCAL_FONTS })).state !== GRANTED
      ) {
        return false;
      }
      return true;
    } catch (err) {
      // This simply means the permission isn't implemented yet.
      if (err.name === TYPE_ERROR) {
        return true;
      }
      throw err;
    }
  }

  _filterFontPreview(value, exactMatch = false) {
    const lowerCaseValue = value.toLowerCase();
    let noMatches = true;
    this._fontPreviewList
      .querySelectorAll(`.${FAMILY}`)
      .forEach((fontPreviewItem) => {
        const value = fontPreviewItem.dataset.value.toLowerCase();
        const matches = exactMatch
          ? value === lowerCaseValue
          : value.includes(lowerCaseValue);
        if (matches) {
          noMatches = false;
          return (fontPreviewItem.hidden = false);
        }
        fontPreviewItem.hidden = true;
      });
    if (noMatches) {
      this._hideFontPreview();
    }
  }

  _showFontPreview() {
    const fontPreviewItems = this._fontPreviewList.querySelectorAll(
      `.${FAMILY}`
    );
    if (!fontPreviewItems) {
      return;
    }
    this._log('Show');
    this._index = -1;
    const { y } = this.getBoundingClientRect();
    this._fontPreviewList.style.top = `calc(${y}px + var(--input-height))`;
    this.style.height = 'var(--element-height)';
    this._fontFamilyInput.setAttribute(ARIA_EXPANDED, true);
    this._fontFamilyButton.setAttribute(ARIA_EXPANDED, true);
    this._fontPreviewList.hidden = false;
    fontPreviewItems.forEach((fontPreviewItem) => {
      fontPreviewItem.hidden = false;
      fontPreviewItem.classList.remove(HIGHLIGHT);
    });
  }

  _hideFontPreview() {
    this._log('Hide');
    this._index = -1;
    this.style.height = 'var(--input-height)';
    this._fontFamilyInput.setAttribute(ARIA_EXPANDED, false);
    this._fontFamilyButton.setAttribute(ARIA_EXPANDED, false);
    this._fontPreviewList.hidden = true;
    this._fontPreviewList.querySelectorAll(LI).forEach((fontPreviewItem) => {
      fontPreviewItem.hidden = true;
      fontPreviewItem.classList.remove(HIGHLIGHT);
    });
    this._fontPreviewList.querySelectorAll(DETAILS).forEach((details) => {
      details.open = false;
    });
  }

  _getVisibleFontPreviewItems() {
    return Array.from(this._fontPreviewList.querySelectorAll(LI)).filter(
      (fontPreviewItem) => {
        return !fontPreviewItem.hidden;
      }
    );
  }

  async _initializeDOM() {
    this._index = -1;
    this._hover = false;
    this._closedWithButton = false;

    this._shadowRoot = this.attachShadow({ mode: 'closed' });
    this._shadowRoot.append(template.content.cloneNode(true));

    this._fontFamilyInput = this._shadowRoot.querySelector(INPUT);
    this._fontFamilyButton = this._shadowRoot.querySelector(BUTTON);
    this._fontPreviewList = this._shadowRoot.querySelector(UL);

    if (!('fonts' in NAVIGATOR)) {
      return;
    }

    this._fontFamilyButton.addEventListener('click', (e) => {
      console.log('click');
      this._log('Font family button', e);
      console.log(
        this._fontFamilyButton.getAttribute(ARIA_EXPANDED),
        typeof this._fontFamilyButton.getAttribute(ARIA_EXPANDED)
      );
      if (this._fontFamilyButton.getAttribute(ARIA_EXPANDED) === 'false') {
        console.log('was closed, opening');
        this._closedWithButton = false;
        return this._fontFamilyInput.focus();
      }
      this._closedWithButton = true;
      console.log('was open, closing');
      this._hideFontPreview();
    });

    this._fontFamilyInput.addEventListener('focus', async (e) => {
      this._log('Font family input', e);
      if (await this._requestPermission()) {
        if (!this._closedWithButton) {
          this._closedWithButton = false;
          return this._showFontPreview();
        }
        this._closedWithButton = false;
      }
    });

    this._fontFamilyInput.addEventListener('blur', (e) => {
      this._log('blur Font family input', e);
      if (!this._hover) {
        this._hideFontPreview();
      }
    });

    this._fontPreviewList.addEventListener('pointerdown', (e) => {
      this._log('Font preview list', e);
      const clickedFontPreviewItem = e.target;
      console.log(clickedFontPreviewItem.nodeName.toLowerCase());
      if (clickedFontPreviewItem.nodeName.toLowerCase() !== SUMMARY) {
        return;
      }
      clickedFontPreviewItem.closest(LI).setAttribute(ARIA_SELECTED, true);
      const value = clickedFontPreviewItem.textContent;
      this._fontFamilyInput.value = value;
      this.value = value;
      this._hideFontPreview();
    });

    this._fontPreviewList.addEventListener('pointerout', (e) => {
      this._log('Font preview list', e);
      this._hover = false;
    });

    this._fontPreviewList.addEventListener('pointerover', (e) => {
      this._log('Font preview list', e);
      this._hover = true;
      const hoveredFontPreviewItem = e.target;
      if (hoveredFontPreviewItem.nodeName.toLowerCase() !== SUMMARY) {
        return;
      }
      const visibleFontPreviewItems = this._getVisibleFontPreviewItems();
      this._fontFamilyInput.removeAttribute(ARIA_ACTIVEDESCENDENT);
      visibleFontPreviewItems.forEach((fontPreviewItem, i) => {
        const summary = fontPreviewItem.querySelector(SUMMARY);
        if (summary === hoveredFontPreviewItem) {
          this._index = i;
          this._fontFamilyInput.setAttribute(
            ARIA_ACTIVEDESCENDENT,
            summary.dataset.fontFamily
          );
          return fontPreviewItem.classList.add(HIGHLIGHT);
        }
        fontPreviewItem.classList.remove(HIGHLIGHT);
      });
    });

    this._fontFamilyInput.addEventListener(KEY_DOWN, (e) => {
      this._log('Font family input', e);
      const code = e.code;
      const allowed = [
        ARROW_DOWN,
        ARROW_UP,
        ARROW_LEFT,
        ARROW_RIGHT,
        ESCAPE,
        ENTER,
        NUMPAD_ENTER,
      ];
      if (!allowed.includes(code)) {
        return;
      }
      if (code === ARROW_LEFT || code === ARROW_RIGHT) {
        if (this._index === -1) {
          return;
        }
      }
      if (code === ARROW_UP || code === ARROW_DOWN) {
        if (this._fontFamilyInput.getAttribute(ARIA_EXPANDED) === 'false') {
          this._index = -1;
          console.log('Value ', this._fontFamilyInput.value)
          this._showFontPreview();
          this._filterFontPreview(this._fontFamilyInput.value);
        }
      }
      e.preventDefault();
      console.log(this._index);
      if (code === ESCAPE) {
        this._fontFamilyInput.focus();
        if (this._fontFamilyInput.getAttribute(ARIA_EXPANDED) === 'true') {
          return this._hideFontPreview();
        }
        this._fontFamilyInput.value = '';
        this.value = '';
        return this._showFontPreview();
      }

      const visibleFontPreviewItems = this._getVisibleFontPreviewItems();
      if (code === ENTER || code === NUMPAD_ENTER) {
        const selectedFontPreviewItem = visibleFontPreviewItems[this._index];
        if (selectedFontPreviewItem) {
          selectedFontPreviewItem.setAttribute(ARIA_SELECTED, true);
          const value = selectedFontPreviewItem.dataset.value;
          this._fontFamilyInput.value = value;
          this.value = value;
        }
        return this._hideFontPreview();
      }

      const numVisible = visibleFontPreviewItems.length;

      console.log(visibleFontPreviewItems);
      console.log('Visible', numVisible);
      this._hover = false;
      if (code === ARROW_UP || code === ARROW_DOWN) {
        if (code === ARROW_DOWN) {
          this._index = ++this._index % numVisible;
        } else {
          this._index = this._index > 0 ? --this._index : numVisible - 1;
        }
        this._fontFamilyInput.removeAttribute(ARIA_ACTIVEDESCENDENT);
        visibleFontPreviewItems.forEach((fontPreviewItem, i) => {
          if (this._index === i) {
            fontPreviewItem.scrollIntoView({ block: 'nearest' });
            this._fontFamilyInput.setAttribute(
              ARIA_ACTIVEDESCENDENT,
              fontPreviewItem.dataset.value
            );
            return fontPreviewItem.classList.add(HIGHLIGHT);
          }
          fontPreviewItem.classList.remove(HIGHLIGHT);
        });
        return;
      }

      if (code === ARROW_LEFT || code === ARROW_RIGHT) {
        if (this._index === -1) {
          return;
        }
        visibleFontPreviewItems.forEach((fontPreviewItem, i) => {
          if (this._index === i) {
            if (code === ARROW_RIGHT) {
              const details = fontPreviewItem.querySelector(DETAILS);
              details.open = true;
              details.querySelectorAll(LI).forEach((fontFamilyPreviewItem) => {
                fontFamilyPreviewItem.hidden = false;
              });
              return;
            }
            const details =
              fontPreviewItem.querySelector(DETAILS) ||
              fontPreviewItem.closest(DETAILS);
            details.querySelectorAll(LI).forEach((fontFamilyPreviewItem) => {
              fontFamilyPreviewItem.classList.remove(HIGHLIGHT);
              fontFamilyPreviewItem.hidden = true;
            });
            const fontFamilyPreviewItem = details.parentElement;
            fontFamilyPreviewItem.classList.add(HIGHLIGHT);
            this._index = Array.prototype.indexOf.call(
              this._fontPreviewList.querySelectorAll(`.${FAMILY}`),
              fontFamilyPreviewItem
            );
            details.open = false;
            return;
          }
        });
      }
    });

    this._fontFamilyInput.addEventListener(INPUT, (e) => {
      this._log('Font family input', e);
      const value = this._fontFamilyInput.value;
      if (!value) {
        this.value = '';
        return this._showFontPreview();
      }
      this._filterFontPreview(value);
    });

    this._fontFamilyInput.addEventListener(CHANGE, (e) => {
      this._log('Font family input', e);
      const value = this._fontFamilyInput.value;
      if (!Object.keys(fonts).includes(value)) {
        this._fontPreviewList
          .querySelectorAll(LI)
          .forEach((fontPreviewItem) => {
            fontPreviewItem.setAttribute(ARIA_SELECTED, false);
          });
        this.value = '';
        return (this._fontFamilyInput.value = '');
      }
      this._filterFontPreview(value, true);
    });

    const fonts = {};
    const styleSheet = new CSSStyleSheet();
    for await (const metadata of NAVIGATOR.fonts.query()) {
      if (!fonts[metadata.family]) {
        fonts[metadata.family] = [];
      }
      fonts[metadata.family].push(metadata);
    }
    Object.keys(fonts)
      .sort()
      .forEach((fontFamily, fuck) => {
        if (fuck > 2) {
          return;
        }
        const li = DOCUMENT.createElement(LI);
        li.className = FAMILY;
        li.dataset.value = fontFamily;
        const details = DOCUMENT.createElement(DETAILS);
        const summary = DOCUMENT.createElement(SUMMARY);
        const ul = DOCUMENT.createElement(UL);
        ul.className = VARIATION;
        li.role = OPTION;
        summary.textContent = fontFamily;
        summary.style.fontFamily = fontFamily;
        details.append(summary);
        details.append(ul);
        li.append(details);
        this._fontPreviewList.append(li);
        fonts[fontFamily]
          .map((font) => {
            // Replace font variation name "Arial" with "Arial Regular".
            const variationName = font.fullName.replace(fontFamily, '').trim();
            font.variationName = variationName ? variationName : REGULAR;
            return font;
          })
          .sort((a, b) => {
            // "Regular" always comes first, else use alphabetic order.
            if (a.variationName === REGULAR) {
              return -1;
            } else if (b.variationName === REGULAR) {
              return 1;
            } else if (a.variationName < b.variationName) {
              return -1;
            } else if (a.variationName > b.variationName) {
              return 1;
            }
            return 0;
          })
          .forEach((font) => {
            const detailsLi = DOCUMENT.createElement(LI);
            detailsLi.className = VARIATION;
            detailsLi.role = OPTION;
            detailsLi.style.fontFamily = font.fullName;
            detailsLi.dataset.value = font.fullName;
            detailsLi.hidden = true;
            detailsLi.textContent = font.variationName;
            ul.append(detailsLi);

            styleSheet.insertRule(`
              @font-face {
                font-family: '${font.fullName}';
                src: local('${font.fullName}'),
                    local('${font.postscriptName}');
              }`);
          });
      });
    DOCUMENT.adoptedStyleSheets = [...DOCUMENT.adoptedStyleSheets, styleSheet];

    const { x, y, width } = this.getBoundingClientRect();
    const spacer = this._shadowRoot.querySelector('.spacer');
    spacer.style.width = `${width}px`;
    spacer.style.height = 'var(--input-height)';
    spacer.style.left = `${x}px`;
    spacer.style.top = `${y}px`;
    this.style.display = 'initial';

    const { width: inputWidth } = this._shadowRoot
      .querySelector('[part="wrapper"]')
      .getBoundingClientRect();
    this._fontPreviewList.style.width = `${inputWidth}px`;

    this._fontFamilyInput.disabled = this.disabled ? true : false;
    if (this.autofocus) {
      this._fontFamilyInput.blur();
      this._fontFamilyInput.focus();
    }
    this._shadowRoot.adoptedStyleSheets = [styleSheet];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this._log(
      'Attribute changed',
      `${name}: from "${oldValue}" to "${newValue}"`
    );
    if (name === AUTOFOCUS) {
      if (this.autofocus) {
        this._fontFamilyInput.focus();
      }
    } else if (name === DISABLED) {
      this._fontFamilyInput.disabled = this.disabled;
    } else if (name === VALUE) {
      const customEvent = new CustomEvent(CHANGE, {
        detail: newValue,
      });
      this._log('Font select', customEvent);
      this.dispatchEvent(customEvent);
    }
  }
}

customElements.define('font-select', FontSelect);
