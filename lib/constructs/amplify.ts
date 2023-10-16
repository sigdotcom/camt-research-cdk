import {
  App,
  GitHubSourceCodeProvider,
  RedirectStatus,
} from "@aws-cdk/aws-amplify-alpha";
import { SecretValue, StackProps } from "aws-cdk-lib";
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface AmplifyConstructProps extends StackProps {
  environment: string;
  gitOwner: string;
  gitRepo: string;
}

export default class AmplifyConstruct extends Construct {
  private readonly amplifyApp: App;
  private readonly amplifyServiceRole: Role;

  constructor(scope: Construct, id: string, props: AmplifyConstructProps) {
    super(scope, id);

    const oauthTokenSecretName: string = `GITHUB_TOKEN_${props.environment.toUpperCase()}`;
    const oauthToken: SecretValue = SecretValue.secretsManager(
      oauthTokenSecretName,
      {
        jsonField: "GITHUB_TOKEN_KEY",
      }
    );

    this.amplifyServiceRole = new Role(
      this,
      `Amplify-${props.environment}-${props.gitRepo}-ServiceRole`,
      {
        assumedBy: new ServicePrincipal("amplify.amazonaws.com"),
      }
    );

    this.amplifyApp = new App(
      this,
      `Amplify-${props.environment}-${props.gitRepo}-App`,
      {
        sourceCodeProvider: new GitHubSourceCodeProvider({
          owner: props.gitOwner,
          repository: props.gitRepo,
          oauthToken: oauthToken,
        }),
        role: this.amplifyServiceRole,
      }
    );

    if (props.environment === "prod") {
      const masterBranch = this.amplifyApp.addBranch("main");
    } else {
      const devBranch = this.amplifyApp.addBranch("dev");
    }
  }
  public addPolicy(actions: string[], resources: string[]) {
    this.amplifyServiceRole.addToPolicy(
      new PolicyStatement({
        actions: actions,
        resources: resources,
      })
    );
  }
}
