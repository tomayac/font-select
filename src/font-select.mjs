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

const DEBUG = true;

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
const CHANGE = 'change';
const GRANTED = 'granted';
const LOCAL_FONTS = 'local-fonts';
const NONE = 'none';
const BLOCK = 'block';
const TYPE_ERROR = 'TypeError';
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
      max-width: 100%;
      width: max-content;
      border: solid 1px FieldText;
    }

    .variation {
      display: block;
      border: none;
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
    input:focus {
      outline: none;
    }

    input[aria-expanded=true]  {
      box-shadow: inset 1px -1px 0 #e57576,
                  inset 0px 1px 0 #e57576;
    }

    button[aria-expanded=true] {
      box-shadow: inset 0px -1px 0 #e57576,
                  inset 0px 1px 0 #e57576,
                  inset -1px 0px 0 #e57576;
    }

    button {
      appearance: none;
      border-right: 2px inset;
      border-bottom: 2px inset;
      border-left: solid 1px inset;
      border-top: 2px inset;
      height: var(--input-height);
      width: var(--input-height);
    }

    button::before {
      content: "▸";
      color: GrayText;
      display: inline-block;
      position: relative;
      top: -0.25rem;
    }

    button[aria-expanded=true]::before {
      transform: rotate(-90deg);
    }

    button[aria-expanded=false]::before {
      transform: rotate(90deg);
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
    <input part="font-family-input" id="family" type="search" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="autocomplete">
    <button tabindex="-1" aria-label="${FONT_FAMILIES}" aria-expanded="false" aria-controls="autocomplete"></button>
    <label part="font-family-label" for="family">${FONT_FAMILY}</label>
  </div>
  <div class="spacer"></div>
  <ul part="font-family-preview" id="autocomplete" role="listbox" aria-label="${FONT_FAMILIES}"></ul>`;

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
    let noneMatches = true;
    this._fontPreviewList.fontPreviewItems.forEach((fontPreviewItem) => {
      const matches = exactMatch
        ? fontPreviewItem.textContent.toLowerCase() === lowerCaseValue
        : fontPreviewItem.textContent.toLowerCase().includes(lowerCaseValue);
      if (matches) {
        noneMatches = false;
        return (fontPreviewItem.style.display = BLOCK);
      }
      fontPreviewItem.style.display = NONE;
    });
    if (noneMatches) {
      this._hideFontPreview();
    }
  }

  _showFontPreview() {
    if (!this._fontPreviewList.fontPreviewItems) {
      return;
    }
    this._log('Show');
    this._index = -1;
    this._fontPreviewList.style.top = this.getBoundingClientRect.bottom;
    this.style.height = 'var(--element-height)';
    this._fontFamilyInput.setAttribute(ARIA_EXPANDED, true);
    this._fontFamilyButton.setAttribute(ARIA_EXPANDED, true);
    this._fontPreviewList.style.display = BLOCK;
    this._fontPreviewList.fontPreviewItems.forEach((fontPreviewItem) => {
      fontPreviewItem.style.display = BLOCK;
      fontPreviewItem.classList.remove(HIGHLIGHT);
    });
  }

  _hideFontPreview() {
    this._index = -1;
    this.style.height = 'var(--input-height)';
    this._fontFamilyInput.setAttribute(ARIA_EXPANDED, false);
    this._fontFamilyButton.setAttribute(ARIA_EXPANDED, false);
    this._fontPreviewList.style.display = NONE;
    this._fontPreviewList.fontPreviewItems.forEach((fontPreviewItem) => {
      fontPreviewItem.style.display = NONE;
      fontPreviewItem.classList.remove(HIGHLIGHT);
    });
  }

  _getVisibleFontPreviewItems() {
    return this._fontPreviewList.fontPreviewItems.filter((fontPreviewItem) => {
      return fontPreviewItem.style.display !== NONE;
    });
  }

  async _initializeDOM() {
    this._index = -1;
    this._hover = false;

    this._shadowRoot = this.attachShadow({ mode: 'closed' });
    this._shadowRoot.append(template.content.cloneNode(true));

    this._fontFamilyInput = this._shadowRoot.querySelector(INPUT);
    this._fontFamilyButton = this._shadowRoot.querySelector(BUTTON);
    this._fontPreviewList = this._shadowRoot.querySelector(UL);

    if (!('fonts' in NAVIGATOR)) {
      return;
    }

    this._fontFamilyButton.addEventListener('click', (e) => {
      this._log('Font family button', e);
      if (this._fontFamilyButton.getAttribute(ARIA_EXPANDED) === 'false') {
        return this._fontFamilyInput.focus();
      }
      this._hideFontPreview();
    });

    this._fontFamilyInput.addEventListener('focus', async (e) => {
      this._log('Font family input', e);
      if (await this._requestPermission()) {
        return this._showFontPreview();
      }
    });

    this._fontFamilyInput.addEventListener('blur', (e) => {
      this._log('Font family input', e);
      if (!this._hover) {
        this._hideFontPreview();
      }
    });

    this._fontPreviewList.addEventListener('pointerdown', (e) => {
      this._log('Font preview list', e);
      const clickedFontPreviewItem = e.target;
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
            summary.textContent
          );
          return fontPreviewItem.classList.add(HIGHLIGHT);
        }
        fontPreviewItem.classList.remove(HIGHLIGHT);
      });
    });

    this._fontFamilyInput.addEventListener('keydown', (e) => {
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
      e.preventDefault();
      if (code === ESCAPE) {
        this._fontFamilyInput.focus();
        if (this._fontFamilyInput.getAttribute(ARIA_EXPANDED === 'true')) {
          return this._hideFontPreview();
        }
        this._fontFamilyInput.value = '';
        this.value = '';
        return this._showFontPreview();
      }
      const visibleFontPreviewItems = this._getVisibleFontPreviewItems();
      if (code === ENTER || code === NUMPAD_ENTER) {
        if (visibleFontPreviewItems[this._index]) {
          visibleFontPreviewItems[this._index].setAttribute(
            ARIA_SELECTED,
            true
          );
          const value = visibleFontPreviewItems[this._index].querySelector(
            SUMMARY
          ).textContent;
          this._fontFamilyInput.value = value;
          this.value = value;
        }
        return this._hideFontPreview();
      }
      const numVisible = visibleFontPreviewItems.length;
      this._hover = false;
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
            fontPreviewItem.querySelector(SUMMARY).textContent
          );
          return fontPreviewItem.classList.add(HIGHLIGHT);
        }
        fontPreviewItem.classList.remove(HIGHLIGHT);
      });
    });

    this._fontFamilyInput.addEventListener(INPUT, (e) => {
      this._log('Font family input', e);
      const value = this._fontFamilyInput.value;
      if (!value) {
        return this._showFontPreview();
      }
      this._filterFontPreview(value);
    });

    this._fontFamilyInput.addEventListener(CHANGE, (e) => {
      this._log('Font family input', e);
      const value = this._fontFamilyInput.value;
      if (!Object.keys(fonts).includes(value)) {
        this._fontPreviewList.fontPreviewItems.forEach((fontPreviewItem) => {
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
      .forEach((fontFamily) => {
        const li = DOCUMENT.createElement(LI);
        const details = DOCUMENT.createElement(DETAILS);
        const summary = DOCUMENT.createElement(SUMMARY);
        const ul = DOCUMENT.createElement(UL);
        ul.className = 'variation';
        li.role = 'option';
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
            detailsLi.className = 'variation';
            ul.append(detailsLi);
            detailsLi.textContent = font.variationName;

            styleSheet.insertRule(`
              @font-face {
                font-family: '${font.fullName}';
                src: local('${font.fullName}'),
                    local('${font.postscriptName}');
              }`);
          });
      });
    this._fontPreviewList.fontPreviewItems = Array.from(
      this._fontPreviewList.querySelectorAll(`${LI}:not(.variation)`)
    );
    DOCUMENT.adoptedStyleSheets = [...DOCUMENT.adoptedStyleSheets, styleSheet];

    const { x, y, width, height } = this.getBoundingClientRect();
    const spacer = this._shadowRoot.querySelector('.spacer');
    spacer.style.width = `${width}px`;
    spacer.style.height = `${height}px`;
    spacer.style.left = `${x}px`;
    spacer.style.top = `${y}px`;

    this.style.display = 'initial';

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
