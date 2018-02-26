import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import './StartingScreen.css'
import StartingScreenComponent from './StartingScreenComponent'

import { getObjectKey } from 'helper/utils'

import { handleUrlInput, resetConfig } from 'actions/config'
import { resetResult, resetTestStatus } from 'actions/result'
import { prepareTest, startTest } from 'actions/test'


class StartingScreen extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showAdvancedConfig: false
    }
  }

  reset = () => {
    this.props.actions.resetConfig()
    this.props.actions.resetResult()
  }

  parseQueryString = (queryString) => {
    const params = {}
    queryString.replace('?','').split('&').forEach(p => {
      const param = p.split('=')
      params[param[0]] = param[1] ? param[1] : true
    })
    return params
  }

  startTest = async (url = null) => {
    const { history } = this.props
    try {
      const urlInfo = await this.props.actions.prepareTest(url)
      history.push('/')
      const testOverview = await this.props.actions.startTest(urlInfo)
      history.push(`/test/${getObjectKey(testOverview.id)}`)
    } catch (e) {
      this.props.actions.resetTestStatus()
    }
  }

  onSubmit = () => {
    this.startTest(this.props.config.url)
  }

  componentWillMount() {
    if (!this.props.result.isInitiated) {
      this.reset()
    }
    const params = this.parseQueryString(this.props.location.search)
    if (params.url) {
      const { history } = this.props
      history.push('/')
      this.props.actions.handleUrlInput(params.url)
      this.startTest(params.url)
    }
    if (params.advanced) {
      this.setState({ showAdvancedConfig: true })
    }
  }

  render() {
    return (
      <StartingScreenComponent { ...this.props } { ...this.state} onSubmit={this.onSubmit} />
    )
  }
}

StartingScreen.propTypes = {
  testOverview: PropTypes.object,
  actions: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  isRateLimited: PropTypes.bool.isRequired,
  isBaqendApp: PropTypes.bool.isRequired,
  competitorTest: PropTypes.object.isRequired,
  speedKitTest: PropTypes.object.isRequired,
}

function mapStateToProps(state) {
  return {
    testOverview: state.result.testOverview,
    config: state.config,
    isRateLimited: state.result.isRateLimited,
    isBaqendApp: state.result.isBaqendApp,
    competitorTest: state.result.competitorTest,
    speedKitTest: state.result.speedKitTest,
    result: state.result,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({
      handleUrlInput,
      resetResult,
      resetTestStatus,
      resetConfig,
      prepareTest,
      startTest,
    }, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StartingScreen)
