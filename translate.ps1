$basePath = "C:\Users\Andres\Music\TableFlow"

$files = @(
  "apps\frontend\src\app\(protected)\admin\roles\page.tsx",
  "apps\frontend\src\app\(protected)\admin\roles\new\page.tsx",
  "apps\frontend\src\app\(protected)\admin\roles\[roleId]\page.tsx",
  "apps\frontend\src\app\(protected)\admin\restaurants\page.tsx",
  "apps\frontend\src\app\(protected)\admin\audit\page.tsx",
  "apps\frontend\src\app\(protected)\admin\settings\page.tsx",
  "apps\frontend\src\app\(protected)\admin\notifications\page.tsx",
  "apps\frontend\src\app\(protected)\admin\permissions\page.tsx",
  "apps\frontend\src\components\admin\user-form.tsx",
  "apps\frontend\src\components\admin\permission-matrix.tsx",
  "apps\frontend\src\components\admin\role-form.tsx",
  "apps\frontend\src\components\admin\admin-page-layout.tsx",
  "apps\frontend\src\app\(protected)\restaurants\page.tsx",
  "apps\frontend\src\app\(protected)\restaurants\create\page.tsx",
  "apps\frontend\src\app\(protected)\restaurants\[id]\page.tsx",
  "apps\frontend\src\app\(protected)\restaurants\[id]\edit\page.tsx",
  "apps\frontend\src\app\(protected)\restaurants\[id]\tables\page.tsx",
  "apps\frontend\src\app\(protected)\restaurants\[id]\tables\create\page.tsx",
  "apps\frontend\src\app\(protected)\restaurants\[id]\tables\[tableId]\page.tsx",
  "apps\frontend\src\app\(protected)\restaurants\[id]\tables\[tableId]\edit\page.tsx",
  "apps\frontend\src\app\(protected)\restaurants\[id]\tables\floor-plan\page.tsx",
  "apps\frontend\src\app\(protected)\restaurants\[id]\dining-areas\page.tsx",
  "apps\frontend\src\app\(protected)\restaurants\[id]\dining-areas\create\page.tsx",
  "apps\frontend\src\app\(protected)\restaurants\[id]\dining-areas\[diningAreaId]\page.tsx",
  "apps\frontend\src\app\(protected)\restaurants\[id]\dining-areas\[diningAreaId]\edit\page.tsx",
  "apps\frontend\src\app\(protected)\restaurants\[id]\reservations\page.tsx",
  "apps\frontend\src\app\(protected)\restaurants\[id]\reservations\create\page.tsx",
  "apps\frontend\src\app\(protected)\restaurants\[id]\reservations\[reservationId]\page.tsx",
  "apps\frontend\src\app\(protected)\restaurants\[id]\reservations\[reservationId]\edit\page.tsx",
  "apps\frontend\src\app\(protected)\restaurants\[id]\reservations\calendar\page.tsx",
  "apps\frontend\src\components\restaurants\restaurant-form.tsx",
  "apps\frontend\src\components\restaurants\restaurant-actions.tsx",
  "apps\frontend\src\components\restaurants\confirm-action-dialog.tsx",
  "apps\frontend\src\components\restaurants\restaurant-detail-view.tsx",
  "apps\frontend\src\components\restaurants\restaurant-status-badge.tsx",
  "apps\frontend\src\app\(protected)\inventory\page.tsx",
  "apps\frontend\src\app\(protected)\inventory\products\page.tsx",
  "apps\frontend\src\app\(protected)\inventory\products\new\page.tsx",
  "apps\frontend\src\app\(protected)\inventory\products\[productId]\page.tsx",
  "apps\frontend\src\app\(protected)\inventory\products\[productId]\edit\page.tsx",
  "apps\frontend\src\app\(protected)\inventory\categories\page.tsx",
  "apps\frontend\src\app\(protected)\inventory\suppliers\page.tsx",
  "apps\frontend\src\app\(protected)\inventory\suppliers\new\page.tsx",
  "apps\frontend\src\app\(protected)\inventory\suppliers\[supplierId]\page.tsx",
  "apps\frontend\src\app\(protected)\inventory\stock\page.tsx",
  "apps\frontend\src\app\(protected)\inventory\stock-movements\page.tsx",
  "apps\frontend\src\app\(protected)\inventory\purchase-orders\page.tsx",
  "apps\frontend\src\app\(protected)\inventory\purchase-orders\new\page.tsx",
  "apps\frontend\src\app\(protected)\inventory\purchase-orders\[orderId]\page.tsx",
  "apps\frontend\src\app\(protected)\inventory\alerts\page.tsx",
  "apps\frontend\src\app\(protected)\inventory\receiving\page.tsx",
  "apps\frontend\src\components\inventory\dashboard\inventory-dashboard-content.tsx",
  "apps\frontend\src\components\inventory\products\product-form.tsx",
  "apps\frontend\src\components\inventory\products\product-list.tsx",
  "apps\frontend\src\components\inventory\products\product-detail.tsx",
  "apps\frontend\src\components\inventory\shared\page-header.tsx",
  "apps\frontend\src\components\inventory\shared\inventory-filters.tsx",
  "apps\frontend\src\components\inventory\suppliers\supplier-form.tsx",
  "apps\frontend\src\components\inventory\suppliers\supplier-list.tsx",
  "apps\frontend\src\components\inventory\suppliers\supplier-detail.tsx",
  "apps\frontend\src\components\inventory\categories\category-list.tsx",
  "apps\frontend\src\components\inventory\stock\stock-table.tsx",
  "apps\frontend\src\components\inventory\stock-movements\movement-table.tsx",
  "apps\frontend\src\components\inventory\purchase-orders\purchase-order-form.tsx",
  "apps\frontend\src\components\inventory\purchase-orders\purchase-order-list.tsx",
  "apps\frontend\src\components\inventory\purchase-orders\purchase-order-detail.tsx",
  "apps\frontend\src\components\inventory\alerts\alerts-view.tsx",
  "apps\frontend\src\components\inventory\receiving\receiving-form.tsx",
  "apps\frontend\src\app\(protected)\orders\page.tsx",
  "apps\frontend\src\app\(protected)\orders\new\page.tsx",
  "apps\frontend\src\app\(protected)\orders\[orderId]\page.tsx",
  "apps\frontend\src\components\orders\order-dashboard-content.tsx",
  "apps\frontend\src\components\orders\order-form.tsx",
  "apps\frontend\src\components\orders\order-list.tsx",
  "apps\frontend\src\components\orders\order-detail-view.tsx",
  "apps\frontend\src\components\kitchen\kds-dashboard.tsx",
  "apps\frontend\src\components\kitchen\kds-header.tsx",
  "apps\frontend\src\components\kitchen\order-board.tsx",
  "apps\frontend\src\components\kitchen\order-card.tsx",
  "apps\frontend\src\components\kitchen\station-selector.tsx",
  "apps\frontend\src\components\kitchen\preparation-timer.tsx",
  "apps\frontend\src\app\(protected)\customers\list\page.tsx",
  "apps\frontend\src\app\(protected)\customers\[customerId]\page.tsx",
  "apps\frontend\src\app\(protected)\customers\[customerId]\edit\page.tsx",
  "apps\frontend\src\app\(protected)\customers\new\page.tsx",
  "apps\frontend\src\components\customers\dashboard\customer-dashboard-content.tsx",
  "apps\frontend\src\components\customers\form\customer-form.tsx",
  "apps\frontend\src\components\customers\list\customer-list.tsx",
  "apps\frontend\src\components\customers\profile\customer-profile-view.tsx",
  "apps\frontend\src\components\customers\shared\page-header.tsx",
  "apps\frontend\src\app\(protected)\analytics\page.tsx",
  "apps\frontend\src\app\(protected)\loyalty\page.tsx",
  "apps\frontend\src\app\(protected)\loyalty\reward-history\page.tsx",
  "apps\frontend\src\app\(auth)\session-expired\page.tsx",
  "apps\frontend\src\app\(errors)\401\page.tsx",
  "apps\frontend\src\app\(errors)\403\page.tsx",
  "apps\frontend\src\app\(protected)\pos\page.tsx",
  "apps\frontend\src\components\pos\pos-interface.tsx",
  "apps\frontend\src\components\pos\order-summary.tsx",
  "apps\frontend\src\components\pos\payment-form.tsx",
  "apps\frontend\src\app\(protected)\placeholder-page.tsx"
)

function Add-Import($content) {
  if ($content -match "import \{ t \} from '@/lib/i18n'") {
    return $content
  }
  if ($content -match "'use client';") {
    return $content -replace "'use client';", "'use client';`nimport { t } from '@/lib/i18n';"
  }
  return "import { t } from '@/lib/i18n';`n" + $content
}

function Convert-Props($content) {
  # title= description= placeholder= message= emptyMessage= createLabel= subtitle= heading= subheading= note= errorMessage= subtext= tooltip= summary= body=
  # Only when it's a JSX attribute (double-quoted string value, preceded by space)
  $patterns = @('title', 'description', 'placeholder', 'message', 'emptyMessage', 'createLabel', 'subtitle', 'subheading', 'note', 'errorMessage', 'subtext', 'tooltip', 'summary', 'body')
  $joined = ($patterns -join '|')
  $content = $content -replace "(?<=\s)($joined)=(""(?:[^`"\\]|\\.)*?"")", '${1}={t($2)}'

  # aria-label
  $content = $content -replace '(?<=\s)(aria-label)=("(?:[^"\\]|\\.)*?")', '${1}={t($2)}'

  # label= prop in JSX
  $content = $content -replace '(?<=\s)(label)=("(?:[^"\\]|\\.)*?")', '${1}={t($2)}'

  return $content
}

function Convert-ObjectProps($content) {
  # Breadcrumb items: { label: 'Text' }
  $content = $content -replace "(?<=\blabel:\s*)'([^']+)'(?=\s*[,}])", "t('`$1')"

  # Column headers: header: 'Text'
  $content = $content -replace "(?<=\bheader:\s*)'([^']+)'(?=\s*[,}])", "t('`$1')"

  # Data arrays: name: 'Text' (for channel names, template names, etc.)
  $content = $content -replace "(?<=\bname:\s*)'([^']+)'(?=\s*[,}])", "t('`$1')"

  # Data arrays: description: 'Text' (for channel descriptions, etc.)
  $content = $content -replace "(?<=\bdescription:\s*)'([^']+)'(?=\s*[,}])", "t('`$1')"

  # Data arrays: status: 'Text' (for status values in data)
  $content = $content -replace "(?<=\bstatus:\s*)'([^']+)'(?=\s*[,}])", "t('`$1')"

  return $content
}

function Convert-FunctionCalls($content) {
  # confirm and alert with backtick strings (no template variables): confirm(`...`), alert(`...`)
  # Exclude template literals with ${...} expressions
  $content = $content -replace '(?<![\.\w])(confirm|alert)\(`((?:[^`$]|\$(?!\{))+?)`\)', '$1(t("$2"))'

  # confirm and alert with single-quoted strings: confirm('...'), alert('...')
  $content = $content -replace "(?<![\.\w])(confirm|alert)\('([^']+)'\)", '$1(t("$2"))'

  # toast.success and toast.error with backtick strings
  $content = $content -replace '(?<=toast\.(?:success|error))\(`([^`]+)`\)', '(t("$1"))'

  # toast.success and toast.error with single-quoted strings
  $content = $content -replace "(?<=toast\.(?:success|error))\('([^']+)'\)", '(t("$1"))'

  return $content
}

function Convert-JsxTextNodes($content) {
  # Common button texts, badge labels, and other inline JSX text
  # Targeted patterns that are safe to replace
  $replacements = @{
    '> View<' = '>{t("View")}<'
    '> Delete<' = '>{t("Delete")}<'
    '> Edit<' = '>{t("Edit")}<'
    '> Save<' = '>{t("Save")}<'
    '> Cancel<' = '>{t("Cancel")}<'
    '> Create<' = '>{t("Create")}<'
    '> Back<' = '>{t("Back")}<'
    '> Close<' = '>{t("Close")}<'
    '>System<' = '>{t("System")}<'
    '>Default<' = '>{t("Default")}<'
    '>Active<' = '>{t("Active")}<'
    '>Inactive<' = '>{t("Inactive")}<'
    '>Paused<' = '>{t("Paused")}<'
    '>Suspended<' = '>{t("Suspended")}<'
    '>Loading<' = '>{t("Loading")}<'
    '>No results<' = '>{t("No results")}<'
    '>Create Role<' = '>{t("Create Role")}<'
    '>New Role<' = '>{t("New Role")}<'
    '>Edit Role<' = '>{t("Edit Role")}<'
    '>Create User<' = '>{t("Create User")}<'
    '>New User<' = '>{t("New User")}<'
    '>Edit User<' = '>{t("Edit User")}<'
    '>Add User<' = '>{t("Add User")}<'
    '>Search<' = '>{t("Search")}<'
    '>Reset<' = '>{t("Reset")}<'
    '>Apply<' = '>{t("Apply")}<'
    '>Filters<' = '>{t("Filters")}<'
    '>Export<' = '>{t("Export")}<'
    '>Import<' = '>{t("Import")}<'
    '>Save Settings<' = '>{t("Save Settings")}<'
    '>All Restaurants<' = '>{t("All Restaurants")}<'
    '>View and manage restaurants<' = '>{t("View and manage restaurants")}<'
    '>Restaurant Settings<' = '>{t("Restaurant Settings")}<'
    '>Channels<' = '>{t("Channels")}<'
    '>Templates<' = '>{t("Templates")}<'
    '>Template Name<' = '>{t("Template Name")}<'
    '>Channel<' = '>{t("Channel")}<'
    '>Status<' = '>{t("Status")}<'
    '>Timestamp<' = '>{t("Timestamp")}<'
    '>Module<' = '>{t("Module")}<'
    '>Action<' = '>{t("Action")}<'
    '>Entity<' = '>{t("Entity")}<'
    '>User<' = '>{t("User")}<'
    '>IP<' = '>{t("IP")}<'
    '>Localization<' = '>{t("Localization")}<'
    '>Appearance<' = '>{t("Appearance")}<'
    '>Security<' = '>{t("Security")}<'
    '>Notifications<' = '>{t("Notifications")}<'
    '>Billing & Currency<' = '>{t("Billing & Currency")}<'
    '>Dark Mode<' = '>{t("Dark Mode")}<'
    '>Compact Mode<' = '>{t("Compact Mode")}<'
    '>Refresh<' = '>{t("Refresh")}<'
  }

  foreach ($key in $replacements.Keys) {
    $content = $content -replace [regex]::Escape($key), $replacements[$key]
  }
  return $content
}

function Convert-SingleQuotedProps($content) {
  # Handle single-quoted prop values: title='...' description='...' etc
  $patterns = @('title', 'description', 'placeholder', 'message', 'emptyMessage', 'createLabel', 'subtitle', 'subheading', 'note', 'errorMessage', 'subtext', 'tooltip', 'summary', 'body', 'label', 'aria-label')
  $joined = ($patterns -join '|')
  $content = $content -replace "(?<=\s)($joined)='([^']*?)'", '${1}={t("$2")}'
  return $content
}

$totalFiles = 0
$totalModified = 0

foreach ($relativePath in $files) {
  $filePath = Join-Path $basePath $relativePath
  if (-not (Test-Path $filePath)) {
    Write-Host "SKIP: $relativePath (not found)"
    continue
  }

  $totalFiles++
  $content = Get-Content -Path $filePath -Raw
  $original = $content

  $content = Add-Import $content
  $content = Convert-Props $content
  $content = Convert-ObjectProps $content
  $content = Convert-FunctionCalls $content
  $content = Convert-JsxTextNodes $content
  $content = Convert-SingleQuotedProps $content

  if ($content -ne $original) {
    Set-Content -Path $filePath -Value $content -NoNewline
    $totalModified++
    Write-Host "MODIFIED: $relativePath"
  } else {
    Write-Host "UNCHANGED: $relativePath"
  }
}

Write-Host "`n=== SUMMARY ==="
Write-Host "Files checked: $totalFiles"
Write-Host "Files modified: $totalModified"
