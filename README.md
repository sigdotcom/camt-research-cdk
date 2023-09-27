# Center for Aerospace Manufacturing Technologies (CAMT) AWS CDK

The Center for Aerospace Manufacturing Technologies (CAMT) was established in May 2004 by the Missouri University Of Science and Technology (Missouri S&T) in partnership with The Air Force Research Labs and Boeing Research and Technology. It serves as a U.S. center of excellence for the development and transition of innovative advanced technologies for the aerospace manufacturing supply chain.

Learn more at https://camt.mst.edu/

## Getting Started

- Install NodeJs [https://nodejs.org/en]
- Install git (Windows only) [https://git-scm.com/]
- Install AWS CLI [https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html]

- `npm install -g typescript` Install TypeScript globally
- `npm install -g aws-cdk` Install AWS CDK Toolkit (cdk cli)

### First-time setup

#### Set alias

- Windows: `doskey cdk=npx aws-cdk $*`
- macOS/Linux: `alias cdk="npx aws-cdk"`

#### Clone GitHub Repository

- `git clone git@github.com:sigdotcom/camt-research-cdk.git`

#### Setup AWS enviroment

- `aws configure sso` AWS CLI Wizard for setting credentials for your ACM AWS account
- `npm run bootstrap` Setup your AWS account with initial resources for CDK deployment
- `npm run deploy` Compile TypeScript code to JS, synthesizes CloudFormation template, deploy this stack to AWS account

### After first-time setup

Bootstraping and authentication is a one time step, only need to run the deploy command from here on out:

- `npm run deploy` Compile TypeScript code to JS, synthesizes CloudFormation template, deploy this stack to AWS account
