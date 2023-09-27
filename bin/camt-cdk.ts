#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CamtCdkStack } from "../lib/camt-cdk-stack";

const app = new cdk.App();

new CamtCdkStack(app, "CamtCdkStack", {});
