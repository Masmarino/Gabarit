# RadioGroup

Groupe de boutons radio pour un choix exclusif parmi plusieurs options.
S'intègre aux formulaires Angular via `ControlValueAccessor`, comme
`Checkbox` et `Select`.

**Selector**: `gbt-radio-group`

## Inputs

| Input          | Type                            | Default    | Role                                                    |
| -------------- | -------------------------------- | ---------- | -------------------------------------------------------- |
| `label`        | `string`                         | required   | Légende du groupe (`<legend>`).                          |
| `options`      | `RadioOption<T>[]`               | required   | Options du groupe.                                       |
| `orientation`  | `'vertical' \| 'horizontal'`     | `'vertical'` | Disposition des options.                                |
| `disabled`     | `boolean`                        | `false`    | Désactive tout le groupe.                                |
| `required`     | `boolean`                        | `false`    | Affiche un `*` à côté du label.                          |
| `errorMessage` | `string \| null`                 | `null`     | Message d'erreur, associé via `aria-describedby`.        |

```ts
interface RadioOption<T = string> {
  value: T
  label: string
  disabled?: boolean // désactive uniquement cette option
}
```

## Exemple

```html
<gbt-radio-group label="Statut" [options]="statusOptions" formControlName="status" />
```

```ts
statusOptions: RadioOption[] = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'published', label: 'Publié' },
  { value: 'archived', label: 'Archivé' },
]
```

## Accessibilité

Boutons radio natifs (`<input type="radio">`) partageant le même
`name`, dans un `<fieldset>`/`<legend>` — le regroupement, l'état
coché mutuellement exclusif et la navigation clavier (flèches) sont
gérés nativement par le navigateur, sans JavaScript additionnel.
