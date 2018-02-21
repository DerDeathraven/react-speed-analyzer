import { generateSpeedKitConfig, getTLD } from '../helper/configHelper'
import {
  ADD_ERROR,
  INIT_TEST,
  START_TEST,
  TESTOVERVIEW_SAVE,
  CALL_PAGESPEED_INSIGHTS_GET,
  RATE_LIMITER_GET,
  NORMALIZE_URL_POST,
  RESET_TEST_RESULT,
} from './types'

import { isURL } from '../helper/utils'

/**
 * Prepares the test before its execution (check rate limiting and normalize url).
 */
export const prepareTest = (url = null) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    dispatch({
      type: INIT_TEST,
    })

    try {
      if (!isURL(url)) {
        throw new Error("Input is not a valid url")
      }
      const rateLimitResult = await db.modules.get('rateLimiter')
      dispatch({
        type: RATE_LIMITER_GET,
        payload: rateLimitResult.isRateLimited,
      })

      if(!rateLimitResult.isRateLimited) {
        const { isMobile } = getState().config
        const urlInfo = await db.modules.post('normalizeUrl', { urls: url, mobile: isMobile })

        if (!urlInfo[0]) {
          throw new Error("Input is not a valid url")
        }
        if (urlInfo[0].isBaqendApp) {
          throw new Error("Url is already a Baqend app")
        }

        dispatch({
          type: NORMALIZE_URL_POST,
          payload: urlInfo[0]
        })
        return urlInfo[0]
      }
    } catch(e) {
      dispatch({
        type: RESET_TEST_RESULT,
      })
      dispatch({
        type: ADD_ERROR,
        payload: e,
      })
      throw e
    }
  }
})

/**
 * Triggers the start of a new test.
 */
export const startTest = (urlInfo = {}) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    dispatch({ type: RESET_TEST_RESULT })
    try {
      // const { url, isMobile } = getState().config
      dispatch({
        type: START_TEST,
      })
      // const testOverview = await dispatch(createTestOverview({ ...urlInfo }))
      // dispatch(callPageSpeedInsightsAPI({ testOverview, url, isMobile }))
      const testOverview = await dispatch(runComparison({ ...urlInfo }))
      return testOverview
    } catch(e) {
      dispatch({
        type: RESET_TEST_RESULT,
      })
      dispatch({
        type: ADD_ERROR,
        payload: e,
      })
      throw e
    }
  }
})

export const runComparison = ({ speedkit, speedkitVersion }) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    const { url, location, caching, isMobile, speedKitConfig, activityTimeout } = getState().config
    const testOverview = await db.modules.post('runComparison', {
      url,
      location,
      caching,
      isMobile,
      speedKitConfig,
      activityTimeout,
      speedkit,
      speedkitVersion,
    })
    dispatch({
      type: TESTOVERVIEW_SAVE,
      payload: testOverview
    })
    return testOverview
  }
})

/**
 * Creates a new testOverview object and generates a unique id for it.
 * @param store
 */
export const createTestOverview = ({ speedkit, speedkitVersion }) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    const { url, location, caching, isMobile, speedKitConfig, activityTimeout } = getState().config
    const testOverview = new db.TestOverview()
    const tld = getTLD(url)

    const ids = await Promise.all([
      db.modules.post('generateUniqueId', { entityClass: 'TestOverview' }),
      dispatch(startCompetitorTest({ speedkit, speedkitVersion })),
      dispatch(startSpeedKitTest({ speedkit, speedkitVersion })),
    ])

    testOverview.id = ids[0] + tld.substring(0, tld.length - 1)
    testOverview.url = url
    testOverview.location = location
    testOverview.caching = caching
    testOverview.mobile = isMobile
    testOverview.speedKitConfig = speedKitConfig
    testOverview.activityTimeout = activityTimeout
    testOverview.isSpeedKitComparison = speedkit
    testOverview.speedKitVersion = speedkitVersion
    testOverview.competitorTestResult = new db.TestResult({ id: ids[1] })
    testOverview.speedKitTestResult = new db.TestResult({ id: ids[2] })

    dispatch({
      type: TESTOVERVIEW_SAVE,
      payload: await testOverview.save()
    })

    return testOverview
  }
})

/**
 * Call the Pagespeed Insights API of Google.
 * @param url The URL to be tested.
 * @param isMobile Boolean to verify whether the mobile version should be tested or not.
 */
const callPageSpeedInsightsAPI = ({ testOverview: testOverviewObject, url, isMobile }) => ({
  'BAQEND': [ testOverviewObject, async ({ dispatch, getState, db }, testOverview) => {
    const pageSpeedInsightsResult = await db.modules.get('callPageSpeed', { url, mobile: isMobile })

    dispatch({
      type: CALL_PAGESPEED_INSIGHTS_GET,
      payload: pageSpeedInsightsResult,
    })

    const update = testOverview.partialUpdate()
      .set('psiDomains', pageSpeedInsightsResult.domains)
      .set('psiRequests', pageSpeedInsightsResult.requests)
      .set('psiResponseSize', pageSpeedInsightsResult.bytes)
      .set('psiScreenshot', pageSpeedInsightsResult.screenshot)

    dispatch({
      type: TESTOVERVIEW_SAVE,
      payload: await update.execute()
    })

    return pageSpeedInsightsResult
  }]
})

/**
 * Starts the test for the competitor version.
 */
const startCompetitorTest = ({ speedkit }) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    const { url, location, caching, isMobile: mobile, activityTimeout } = getState().config

    const competitorTestId = await db.modules.post('queueTest', {
      url,
      activityTimeout,
      isSpeedKitComparison: speedkit,
      location,
      isClone: false,
      caching,
      mobile,
    })

    return competitorTestId.baqendId
  }
})

/**
 * Starts the test for the speed kit version.
 */
const startSpeedKitTest = ({ speedkit }) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    const { url, location, caching, isMobile, speedKitConfig, activityTimeout } = getState().config

    const competitorTestId = await db.modules.post('queueTest', {
      url,
      activityTimeout,
      isSpeedKitComparison: speedkit,
      speedKitConfig: speedKitConfig || generateSpeedKitConfig(url, '', isMobile),
      // speedKitConfig,
      location,
      isClone: true,
      caching,
      mobile: isMobile,
    })

    return competitorTestId.baqendId
  }
})
