/* eslint-disable no-constant-condition */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { syntaxTree } from "@codemirror/language";
import {
  StateField,
  // concerned about what the document looks like (while also managing the state of the rest of the editor)
  // the state focuses exclusively on re-computing changes to the state based off of inputs and nothing else
  EditorState,
  Extension, RangeSetBuilder, Transaction
} from "@codemirror/state";
import {
  Decoration, DecorationSet,
  // concerned about what the DOM looks like
  // may produce a side effect as a result of the change in state
  EditorView
} from "@codemirror/view";

export const indentStateField = StateField.define<DecorationSet>({
  create(state): DecorationSet {
    return getDecorationSet(state); // initial value
  },

  /**
   * lifecicle for an update: DOM event -> transaction -> create new state -> view update
   * todo: return if no heading were changed or created, or no new line were added
   */
  update(currentValue: DecorationSet, tr: Transaction): DecorationSet {
    if (!tr.docChanged) return currentValue;
    return getDecorationSet(tr.state);
  },

  // this shit is for painting shit using statefield value
  provide(field: StateField<DecorationSet>): Extension {
    return EditorView.decorations.from(field);
  },
});

function getDecorationSet(state: EditorState) {

  /**
   * scan headings across document
   */
  const headings: { text: string; level: number; headingLineNumber: number; }[] = [];
  syntaxTree(state).iterate({
    enter(node) {
      if (node.type.name.startsWith('HyperMD-header_HyperMD-header-')) {
        const lineAt = state.doc.lineAt(node.from); // props: from, to, text, number
        const text = state.doc.sliceString(node.from, node.to);
        const level = Number(node.type.name.slice(-1));

        headings.push({
          text: text,
          level: level,
          headingLineNumber: lineAt.number
        });
      }
    },
  });

  /**
   * apply indenting based on existing headings
   * todo: do not indent if heading structure were not changed; user facade
   */
  const builder = new RangeSetBuilder<Decoration>();
  // const containerWidth = document.getElementsByClassName('cm-content')[0]?.clientWidth;

  const el = document.querySelector(".workspace-leaf.mod-active .cm-content");
  if (el === null) return Decoration.none;

  for (const [index, heading] of headings.entries()) {

    const { level, headingLineNumber } = heading;

    const firstDataLineNumber = headingLineNumber + 1;
    const lastDataLineNumber = headings[index + 1]?.headingLineNumber - 1 || state.doc.lines;

    for (let j = firstDataLineNumber; j < lastDataLineNumber + 1; j++) {
      const dataLine = state.doc.line(j);
      builder.add(
        dataLine.from,
        dataLine.from,
        Decoration.line({
          class: `h${level}-line`,
        })
      );
    }
  }

  return builder.finish();
}