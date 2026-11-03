// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { VApp, VAvatar, VBtn, VCard, VCardActions, VCardText, VChip, VCol, VColorPicker, VContainer, VDialog, VDivider, VFab, VForm, VIcon, VImg, VList, VListItem, VListItemTitle, VMenu, VPagination, VProgressCircular, VRadioGroup, VRow, VSkeletonLoader, VSlider, VSnackbar, VSpacer, VSpeedDial, VSwitch, VTab, VTabs, VTabsWindowItem, VTextField, VTooltip } from 'vuetify/components'
const components = { VApp, VAvatar, VBtn, VCard, VCardActions, VCardText, VChip, VCol, VColorPicker, VContainer, VDialog, VDivider, VFab, VForm, VIcon, VImg, VList, VListItem, VListItemTitle, VMenu, VPagination, VProgressCircular, VRadioGroup, VRow, VSkeletonLoader, VSlider, VSnackbar, VSpacer, VSpeedDial, VSwitch, VTab, VTabs, VTabsWindowItem, VTextField, VTooltip }
import '@mdi/font/css/materialdesignicons.css'


export const vuetify = createVuetify({
    components,
    icons: {
        defaultSet: 'mdi', // 这已经是默认值-仅用于显示目的
    },
    defaults: {
        VCard: {
            variant: 'tonal',
        },
    },
})
