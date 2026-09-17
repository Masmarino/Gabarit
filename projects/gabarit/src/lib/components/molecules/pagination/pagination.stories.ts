import type { Meta, StoryObj } from '@storybook/angular-vite'
import { Component } from '@angular/core'
import { darkTheme } from '../../../../../.storybook/preview'
import { Pagination } from './pagination'

const meta: Meta<Pagination> = {
  title: 'Molecules/Pagination',
  component: Pagination,
}

export default meta
type Story = StoryObj<Pagination>

@Component({
  selector: 'gbt-story-few-pages-host',
  standalone: true,
  imports: [Pagination],
  template: `<gbt-pagination [totalItems]="95" [pageSize]="10" [page]="page" (pageChange)="page = $event" />`,
})
class FewPagesHost {
  page = 1
}

@Component({
  selector: 'gbt-story-many-pages-host',
  standalone: true,
  imports: [Pagination],
  template: `<gbt-pagination [totalItems]="500" [pageSize]="10" [page]="page" (pageChange)="page = $event" />`,
})
class ManyPagesHost {
  page = 12
}

export const FewPages: Story = {
  render: () => ({
    template: `<gbt-story-few-pages-host />`,
    moduleMetadata: { imports: [FewPagesHost] },
  }),
}

export const ManyPagesWithEllipsis: Story = {
  render: () => ({
    template: `<gbt-story-many-pages-host />`,
    moduleMetadata: { imports: [ManyPagesHost] },
  }),
}

@Component({
  selector: 'gbt-story-with-controls-host',
  standalone: true,
  imports: [Pagination],
  template: `
    <gbt-pagination
      [totalItems]="totalItems"
      [pageSize]="pageSize"
      [page]="page"
      [pageSizeOptions]="[10, 20, 30, 50, 100]"
      [showItemsSummary]="true"
      (pageChange)="page = $event"
      (pageSizeChange)="onPageSizeChange($event)"
    />
  `,
})
class WithControlsHost {
  totalItems = 237
  pageSize = 10
  page = 1

  onPageSizeChange(size: number): void {
    this.pageSize = size
  }
}

export const WithControls: Story = {
  render: () => ({
    template: `<gbt-story-with-controls-host />`,
    moduleMetadata: { imports: [WithControlsHost] },
  }),
}

export const FirstPage: Story = {
  args: {
    totalItems: 95,
    pageSize: 10,
    page: 1,
  },
}

export const LastPage: Story = {
  args: {
    totalItems: 95,
    pageSize: 10,
    page: 10,
  },
}

export const SinglePage: Story = {
  args: {
    totalItems: 8,
    pageSize: 10,
    page: 1,
  },
}

export const Disabled: Story = {
  args: {
    totalItems: 95,
    pageSize: 10,
    page: 5,
    pageSizeOptions: [10, 20, 30, 50, 100],
    showItemsSummary: true,
    disabled: true,
  },
}

export const Dark: Story = {
  args: {
    totalItems: 500,
    pageSize: 10,
    page: 12,
  },
  decorators: [darkTheme],
}
