# JobGraph

A read-only graph of pipeline jobs, laid out as one column per stage,
with a curved link drawn from each job to every job it depends on
(GitHub-Actions style). Each job is a native button: clicking one only
emits its id — this component never navigates anywhere and never keeps
a selection of its own.

**Selector**: `gbt-job-graph`

## Inputs

| Input           | Type                                | Default            | Role                                                                 |
| --------------- | ----------------------------------- | ------------------ | -------------------------------------------------------------------- |
| `stages`        | `JobGraphStage[]`                   | required           | The stages, in order, each with its jobs.                            |
| `selectedJobId` | `string \| null`                    | `null`             | The job being viewed; gets `aria-current="true"` and a highlight.     |
| `statusLabels`  | `Record<JobGraphStatus, string>`    | English labels     | Visually-hidden status text announced for each job (`Pending`, `Running`, `Succeeded`, `Failed`, `Canceled`). |
| `needsLabel`    | `string`                            | `'Needs'`          | Visually-hidden prefix announced before a job's dependencies.        |
| `ariaLabel`     | `string`                            | `'Pipeline jobs'`  | Accessible name of the list of stages.                               |

## Outputs

| Output        | Payload  | Role                                            |
| ------------- | -------- | ----------------------------------------------- |
| `jobSelected` | `string` | Emits the `id` of the job whose node was clicked. |

## Types

```ts
type JobGraphStatus = 'pending' | 'running' | 'success' | 'failed' | 'canceled'

interface JobGraphJob {
  id: string
  name: string
  status: JobGraphStatus
  durationLabel?: string
  needs: string[] // job NAMES (not ids)
}

interface JobGraphStage {
  name: string
  jobs: JobGraphJob[]
}
```

`needs` holds the **names** of the jobs a job depends on, not their
ids, so job names must be unique within a graph. A name that matches no
job simply draws no link.

## Example

```html
<gbt-job-graph
  [stages]="[
    { name: 'build', jobs: [{ id: 'a', name: 'compile', status: 'success', durationLabel: '3s', needs: [] }] },
    { name: 'test', jobs: [{ id: 'b', name: 'unit', status: 'running', needs: ['compile'] }] },
  ]"
  [selectedJobId]="selected()"
  (jobSelected)="selected.set($event)"
/>
```

## Behavior

- Each job renders a glyph whose **shape** depends on its status
  (check for `success`, alert for `failed`, cross for `canceled`, a
  ring for `pending`, a spinning ring for `running`), so status never
  relies on colour alone; a visually-hidden text also states it.
- The links are measured from the rendered nodes and redrawn when
  `stages` changes or the container is resized. They scroll with the
  content when the graph overflows horizontally. A link is drawn as
  "done" when the job it starts from succeeded.
- The running spinner is replaced by a solid dot under
  `prefers-reduced-motion: reduce`.
