#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CamtCdkStack } from "../lib/camt-cdk-stack";
import { CamtBackendStack } from "../lib/camt-backend-stack";

const app = new cdk.App();

const infraStack: CamtCdkStack = new CamtCdkStack(app, "CamtCdkStack", {});
const userPool = infraStack.authPool;
const backendStack: CamtBackendStack = new CamtBackendStack(
  app,
  "CamtBackendStack",
  {
    userPool: userPool,
  }
);
