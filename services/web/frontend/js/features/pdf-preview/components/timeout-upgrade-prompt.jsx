import { useTranslation } from 'react-i18next'
import { useEditorContext } from '../../../shared/context/editor-context'
import StartFreeTrialButton from '../../../shared/components/start-free-trial-button'
import { memo } from 'react'
import PdfLogEntry from './pdf-log-entry'
import UpgradeBenefits from '../../../shared/components/upgrade-benefits'
import { useSplitTestContext } from '@/shared/context/split-test-context'

function TimeoutUpgradePrompt() {
  const { t } = useTranslation()

  const { hasPremiumCompile, isProjectOwner } = useEditorContext()

  const { splitTestVariants } = useSplitTestContext()
  const hasNewPaywallCta = splitTestVariants['paywall-cta'] === 'enabled'

  if (!window.ExposedSettings.enableSubscriptions || hasPremiumCompile) {
    return null
  }

  return (
    <PdfLogEntry
      headerTitle={
        isProjectOwner
          ? t('upgrade_for_longer_compiles')
          : t('ask_proj_owner_to_upgrade_for_longer_compiles')
      }
      formattedContent={
        <>
          <p>{t('free_accounts_have_timeout_upgrade_to_increase')}</p>
          <p>{t('plus_upgraded_accounts_receive')}:</p>
          <div>
            <UpgradeBenefits />
          </div>
          {isProjectOwner && (
            <p className="text-center">
              <StartFreeTrialButton
                source="compile-timeout"
                buttonProps={{
                  bsStyle: 'success',
                  className: 'row-spaced-small',
                }}
              >
                {hasNewPaywallCta
                  ? t('get_more_compile_time')
                  : t('start_free_trial')}
              </StartFreeTrialButton>
            </p>
          )}
        </>
      }
      entryAriaLabel={
        isProjectOwner
          ? t('upgrade_for_longer_compiles')
          : t('ask_proj_owner_to_upgrade_for_longer_compiles')
      }
      level="success"
    />
  )
}

export default memo(TimeoutUpgradePrompt)
