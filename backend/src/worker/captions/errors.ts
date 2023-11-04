export class SubtitleError {
  args: any[]
  constructor(...args: any[]) {
    this.args = args
  }
}
export class ThrottlingSubtitleError extends SubtitleError {}
export class UnknownSubtitleError extends SubtitleError {}
export class MissingCaptionsFieldSubtitleError extends SubtitleError {}
export class MissingCaptionsSubtitleError extends SubtitleError {}
export class MissingLanguageSubtitleError extends SubtitleError {}
