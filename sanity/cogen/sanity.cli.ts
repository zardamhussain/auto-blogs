import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '2hri6s6c',
    dataset: 'production'
  },
  /**
   * Enable auto-updates for studios.
   * Learn more at https://www.sanity.io/docs/cli#auto-updates
   */
  autoUpdates: true,
})
