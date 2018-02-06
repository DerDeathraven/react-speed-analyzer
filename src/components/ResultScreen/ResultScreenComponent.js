import React, { Component } from 'react'
import PropTypes from 'prop-types'

import './ResultScreen.css'

import Modal from '../Modal/Modal'

import Result from './Result/Result'
import ResultWorthiness from './ResultWorthiness/ResultWorthiness'
import ResultAction from './ResultAction/ResultAction'

import SpeedKitCarousel from './SpeedKitCarousel/SpeedKitCarousel'
import SpeedKitAnalyzer from './SpeedKitAnalyzer/SpeedKitAnalyzer'
import SpeedKitBanner from './SpeedKitBanner/SpeedKitBanner'

import ConfigForm from '../ConfigForm/ConfigForm'
import ContactForm from '../ContactForm/ContactForm'

class ResultScreenComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showDetails: props.showDetails,
      showConfig: props.showConfig,
      showAdvancedConfig: props.showAdvancedConfig,
      showModal: false,
    }
  }

  toggleDetails = () => {
    this.setState({ showDetails: !this.state.showDetails })
  }

  toggleConfig = () => {
    this.setState({ showConfig: !this.state.showConfig })
  }

  toggleModal = () => {
    this.setState({ showModal: !this.state.showModal })
  }

  closeModal = () => {
    this.setState({ showModal: false })
  }

  renderForm() {
    return (
      <div className="container pa2">
        <div className="mb1">
          <ConfigForm
            config={this.props.config}
            showConfig={this.state.showConfig}
            showAdvancedConfig={this.state.showAdvancedConfig}
            onSubmit={this.props.onSubmit}
          />
        </div>
        {!this.state.showConfig &&
          <div className="toggleSettings text-right">
            <span><a onClick={this.toggleConfig}>Show Settings</a></span>
          </div>
        }
      </div>
    )
  }

  renderResults() {
    // const competitorData = this.props.competitorTest.firstView
    // const speedKitData = this.props.speedKitTest.firstView
    const competitorError = this.props.competitorError
    const speedKitError = this.props.speedKitError
    // console.log(this.props.competitorTest)
    // const competitorData = null
    // const speedKitData = null
    // const competitorError = true
    // const speedKitError = true

    return (
      <div className="flex-grow-1 results animated slideInUp" style={{ animationDuration: '0.8s' }}>
        { !competitorError && (
          <div className="container pa2">
            <div className="box-shadow results__box" style={{ marginTop: '-96px' }}>
              <Result { ...this.props } />
            </div>
          </div>
        )}

        <div className="container pa2 pt2 pb6 animated slideInUp">
          <ResultAction { ...this.props } toggleModal={this.toggleModal}/>
        </div>

        <div className="pv7" style={{ background: 'white' }}>
          {!speedKitError && !competitorError && (
            <div className="container ph2 pb7">
              <ResultWorthiness
                competitorTest={this.props.competitorTest}
                speedKitTest={this.props.speedKitTest}
                mainMetric={this.props.mainMetric}
              />
            </div>
          )}
          <div className="pv1 ph2">
            <SpeedKitCarousel />
          </div>
        </div>

        <div className="pv7"style={{}}>
          <div className="container ph2">
            <SpeedKitAnalyzer />
          </div>
        </div>

        <SpeedKitBanner />
      </div>
    )
  }

  renderContactFormModal() {
    return (
      <Modal show={this.state.showModal} onClose={this.closeModal} onOutsideClick={this.closeModal}>
        <ContactForm onCancel={this.closeModal} />
      </Modal>
    )
  }

  render() {
    const competitorError = this.props.competitorError
    return (
      <div className="flex results__wrapper pt7">
        <div className="flex-grow-1 flex flex-column">
          {this.renderForm()}
          <div className="flex-grow-1 flex flex-column results" style={{marginTop: competitorError ? 0 : 80, animationDelay: '0.6s', transition: 'margin 0.5s ease' }}>
            {this.props.result.isFinished && this.renderResults()}
          </div>
        </div>
        {this.renderContactFormModal()}
      </div>
    )
  }
}

ResultScreenComponent.propTypes = {
  mainMetric: PropTypes.string,
  speedKitError: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default ResultScreenComponent
