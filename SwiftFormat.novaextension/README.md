**SwiftFormat** integrates Nick Lockwood's [SwiftFormat](https://github.com/nicklockwood/SwiftFormat) with [Nova](https://panic.com/nova).

This extension will run the formatter when a Swift document is saved. It can also be invoked as an editor command. 

![](https://raw.githubusercontent.com/PadraigK/swiftformat-nova/main/Images/screenshot.png)

## Requirements

The SwiftFormat extension includes a built-in version of the actual formatter tool, so no additional setup is required. 

If you would like to use a different version, you can set a path to a custom binary in settings. You might do this if you work on a team and want to ensure that everyone is using a particular version.

## Usage
SwiftFormat runs any time a Swift document is saved in Nova, automatically reformatting code according to the default SwiftFormat [rules](https://github.com/nicklockwood/SwiftFormat#rules). You can customize the rules by creating a `.swiftformat` [config file](https://github.com/nicklockwood/SwiftFormat#config-file) in the root of your project. 

To run SwiftFormat manually:

- Select the **Editor → SwiftFormat** menu item; or
- Open the command palette and type `SwiftFormat`

### Configuration
To configure global settings, open **Extensions → Extension Library...** then select SwiftFormat's **Settings** tab.

You can also configure settings on a per-project basis in **Project → Project Settings...**

## Contributing and Collaboration

I'd love to hear from you! Get in touch via [mastodon](https://mastodon.social/@PadraigOCinneide), an issue, or a pull request.

By participating in this project you agree to abide by the [Contributor Code of Conduct](CODE_OF_CONDUCT.md).
