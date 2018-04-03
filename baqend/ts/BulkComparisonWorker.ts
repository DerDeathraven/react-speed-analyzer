import { EntityManager } from 'baqend'
import { MultiComparisonRequest } from './MultiComparisonRequest'
import { MultiComparisonWorker } from './MultiComparisonWorker'

export class BulkComparisonWorker {
  private multiComparisonWorker: MultiComparisonWorker

  constructor(private db: EntityManager) {
    this.multiComparisonWorker = new MultiComparisonWorker(db, this)
  }

  next(bulkComparisonId) {
    this.db.log.info("BulkComparisonWorker next", bulkComparisonId)
    this.db.BulkComparison.load(bulkComparisonId, {depth: 1})
      .then(bulkComparison => bulkComparison.ready())
      .then(bulkComparison => {
        const { multiComparisons, createdBy } = bulkComparison
        const currentMultiComparison = multiComparisons[multiComparisons.length - 1]
        if (multiComparisons.length > 0 && !currentMultiComparison.hasFinished) {
          return
        }

        const nextMultipleComparison = this.getNextMultipleComparison(bulkComparison)
        if (!nextMultipleComparison) {
          return bulkComparison.optimisticSave((it) => {
            it.hasFinished = true
          })
        }
        const multiComparisonRequest = new MultiComparisonRequest(this.db, createdBy, nextMultipleComparison)
        multiComparisonRequest.create().then(multiComparison => {
          bulkComparison.multiComparisons.push(multiComparison)
          bulkComparison.ready().then(() => bulkComparison.save())

          this.multiComparisonWorker.next(multiComparison.id)
        })
      })
    .catch(error => this.db.log.warn(`Error while next iteration`, {id: bulkComparisonId, error: error.stack}))
  }

  getNextMultipleComparison(bulkComparison) {
    const { multiComparisons, comparisonsToStart } = bulkComparison

    return comparisonsToStart.find(comparison => {
      return multiComparisons.filter(multiComparison => multiComparison.url === comparison.url).length === 0
    })
  }
}
