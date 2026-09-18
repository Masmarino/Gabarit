import type { Meta, StoryObj } from '@storybook/angular-vite'
import { Component } from '@angular/core'
import { darkTheme } from '../../../../../.storybook/preview'
import { AvatarGroup, AvatarGroupItem } from './avatar-group'

interface User extends AvatarGroupItem {
  id: string
}

const USERS: User[] = [
  { id: '1', name: 'Ada Lovelace' },
  { id: '2', name: 'Alan Turing', src: 'https://i.pravatar.cc/150?img=12' },
  { id: '3', name: 'Grace Hopper' },
  { id: '4', name: 'Katherine Johnson' },
  { id: '5', name: 'Margaret Hamilton' },
  { id: '6', name: 'Dorothy Vaughan' },
  { id: '7', name: 'Mary Jackson' },
]

const meta: Meta<AvatarGroup<User>> = {
  title: 'Molecules/AvatarGroup',
  component: AvatarGroup,
}

export default meta
type Story = StoryObj<AvatarGroup<User>>

export const NoOverflow: Story = {
  args: {
    items: USERS.slice(0, 3),
  },
}

export const WithOverflow: Story = {
  args: {
    items: USERS,
    max: 5,
  },
}

@Component({
  selector: 'gbt-story-avatar-group-filter-host',
  standalone: true,
  imports: [AvatarGroup],
  template: `
    <div style="display:flex;flex-direction:column;gap:1rem">
      <gbt-avatar-group
        [items]="users"
        [max]="5"
        [activeItem]="selected"
        (itemClick)="selected = selected === $event ? null : $event"
      />
      <p>{{ selected ? 'Filtré sur : ' + selected.name : 'Aucun filtre — cliquez un avatar' }}</p>
    </div>
  `,
})
class FilterHost {
  users = USERS
  selected: User | null = null
}

export const FilterByUser: Story = {
  render: () => ({
    template: `<gbt-story-avatar-group-filter-host />`,
    moduleMetadata: { imports: [FilterHost] },
  }),
}

export const Dark: Story = {
  args: {
    items: USERS,
    max: 5,
  },
  decorators: [darkTheme],
}
