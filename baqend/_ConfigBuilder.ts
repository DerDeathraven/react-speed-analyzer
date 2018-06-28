import { Condition, Config, Rule } from './_Config'

export class ConfigBuilder {

  private appName: string
  private userAgentDetection: boolean
  private whitelist: Rule[] = []
  private blacklist: Rule[] = []

  /**
   * The current size of the config counting all included conditions.
   */
  private size: number = 0
  private maxCapacity: number

  constructor(appName: string, userAgentDetection: boolean, maxCapacity: number = -1) {
    this.appName = appName
    this.userAgentDetection = userAgentDetection
    this.maxCapacity = maxCapacity
  }

  build(): Config {
    const config: Config = { appName: this.appName, userAgentDetection: this.userAgentDetection }

    if (this.whitelist.length) {
      config.whitelist = this.whitelist
    }

    if (this.blacklist.length) {
      config.blacklist = this.blacklist
    }

    return config
  }

  /**
   * Returns the size of the config counting all included conditions.
   */
  getSize(): number {
    return this.size
  }

  capacityReached(): boolean {
    if (this.maxCapacity === -1) {
      return false
    }

    return this.getSize() >= this.maxCapacity;
  }

  whitelistHost(host: Condition): this {
    return this.addToWhitelist('host', host)
  }

  whitelistPathname(host: Condition): this {
    return this.addToWhitelist('pathname', host)
  }

  whitelistUrl(host: Condition): this {
    return this.addToWhitelist('url', host)
  }

  blacklistUrl(host: Condition): this {
    return this.addToBlacklist('url', host)
  }

  private addToWhitelist(section: 'host' | 'pathname' | 'url', value: Condition): this {
    if (this.capacityReached()) {
      return this
    }
    this.size++

    for (const rule of this.whitelist) {
      const condition: Condition | undefined = rule[section]
      // Add to existing entry
      if (condition) {
        if (condition instanceof Array) {
          if (value instanceof Array) {
            condition.concat(value)
          } else {
            condition.push(value)
          }
        } else {
          if (value instanceof Array) {
            rule[section] = [condition].concat(value)
          } else {
            rule[section] = [condition, value]
          }
        }

        return this
      }
    }

    // Add new entry
    this.whitelist.push({ [section]: value })
    return this
  }

  private addToBlacklist(section: 'host' | 'pathname' | 'url', value: Condition): this {
    if (this.capacityReached()) {
      return this
    }
    this.size++

    for (const rule of this.blacklist) {
      const condition: Condition | undefined = rule[section]
      // Add to existing entry
      if (condition) {
        if (condition instanceof Array) {
          if (value instanceof Array) {
            condition.concat(value)
          } else {
            condition.push(value)
          }
        } else {
          if (value instanceof Array) {
            rule[section] = [condition].concat(value)
          } else {
            rule[section] = [condition, value]
          }
        }

        return this
      }
    }

    // Add new entry
    this.blacklist.push({ [section]: value })
    return this
  }
}
