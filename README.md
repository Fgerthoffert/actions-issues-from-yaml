<!-- markdownlint-disable MD041 -->
<p align="center">
  <img alt="ZenCrepesLogo" src="docs/zencrepes-logo.png" height="140" />
  <h2 align="center">Create issues from YAML</h2>
  <p align="center">A GitHub Action to create a GitHub issues in batch from a YAML file.</p>
</p>

---

<div align="center">

[![GitHub Super-Linter](https://github.com/fgerthoffert/actions-issues-from-yaml/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/fgerthoffert/actions-issues-from-yaml/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/fgerthoffert/actions-issues-from-yaml/actions/workflows/check-dist.yml/badge.svg)](https://github.com/fgerthoffert/actions-issues-from-yaml/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/fgerthoffert/actions-issues-from-yaml/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/fgerthoffert/actions-issues-from-yaml/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

</div>

---

# About

A GitHub Action is to facilitate the creation of a large number of GitHub issues
using as input a YAML file containing the specs of the issues to be created.

# Supported Features

The action supports these features:

- Issue hierarchy (definition of parents / children issues)
- Adding links to other issues about to be created in the description of a new
  issue (i.e. cross links between issues not created yet)
- Creation of the issue in any GitHub repository (as long as the provided token
  has the correct permissions)
- Creation of milestones
- Handling of global common variables
- Check the presence of mandatory fields before initiating issue creation

The following issue fields are supported:

- title`*`
- description (body)
- milestone
- project (one project only),
- Status of the issue card in the provided project
- issue type
- labels

`*` denotes a mandatory field, the others are optional.

# Using the action

## Parameters

| Parameter | Default | Description                                          | Required |
| --------- | ------- | ---------------------------------------------------- | -------- |
| token     |         | A GitHub Personal API Token                          | true     |
| config    |         | Filepath to a YAML file containing the configuration | true     |

## Outputs

The following outputs are available:

| Name   | Description                                                      |
| ------ | ---------------------------------------------------------------- |
| issues | A JSON object containing all of the issues created by the action |

# Sample YAML config

The following is a sample YAML file that could be passed to the action

```yaml
config:
  # Create milestone in the issue repository if absent
  createMilestones: true
  variables:
    - name: sw_release
      value: 1.2.3
issues:
  - title: Release myApp v{{ var.sw_release }}
    repository: MY_ORG/MY_REPO
    id: main-release
    description: |
      The goal of this issue is to trigger the release of myApp in v{{ var.sw_release }}

      This will be followed by some testing in {{ id.validate }}.

      Once all is verified, make sure the documentation is published ({{ id.doc }})
    milestone: myApp v{{ var.sw_release }}
    assignees:
      - fgerthoffert
    type: Release
    labels:
      - ci
    children:
      - title: Validate myApp v{{ var.sw_release }}
        repository: MY_ORG/MY_REPO
        id: validate
        description: My sub-issue description
        milestone: myApp v{{ var.sw_release }}
        type: Task
        labels:
          - qa
  - title: Publish the documentation
    repository: MY_ORG/MY_REPO
    description: Do not start until {{ id.validate }} is closed
    milestone: myApp v{{ var.sw_release }}
    type: Task
    labels:
      - docs
```

# Usage

This action is meant at being started manually.

```yaml
name: Create GitHub Issues

on:
  workflow_dispatch:

jobs:
  transfer:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Transfer issue
        # Replace main by the release of your choice
        uses: fgerthoffert/actions-issues-from-yaml@main
        with:
          token: YOUR_TOKEN
          config: '.github/create-issues.yml'
```

Assuming the `.github/create-issues.yml` file exists, it will create the issues
according to the content of this file.

# YAML Spec

The following contains precise specs for the YAML file.

| Parameter | Default | Type   | Description                      | Required |
| --------- | ------- | ------ | -------------------------------- | -------- |
| config    | n/a     | Config | confiugration options            | true     |
| issues    | []      | Issue  | An array of issues to be created | true     |

## Config

| Parameter        | Default | Type             | Description                                                                            |
| ---------------- | ------- | ---------------- | -------------------------------------------------------------------------------------- |
| createMilestones | true    | boolean          | If a milestone does not exist in a repository, it will be created                      |
| variables        |         | ConfigVariable[] | An array of ConfigVariable that are automatically replaced in the content of the issue |

### ConfigVariable

| Parameter | Default | Type   | Description                                                                            |
| --------- | ------- | ------ | -------------------------------------------------------------------------------------- |
| name      | n/a     | string | Name of the variable to use (no white spaces)                                          |
| value     | n/a     | string | An array of ConfigVariable that are automatically replaced in the content of the issue |

Variables are replaced on the following issue fields:

- title
- repository
- description
- milestone
- type
- project title
- project status
- labels
- assignees

**Sample variables usage:**

```yaml
config:
  createMilestones: true
  variables:
    - name: sw_release
      value: 1.2.3
issues:
  - title: Release codebase in v{{ var.sw_release }}
    repo: org/repo
```

The above YAML will create an issue titled `Release codebase in v1.2.3` in the
repository `org/repo`.

## Issue

| Parameter   | Default | Type     | Required | Description                                                                                       |
| ----------- | ------- | -------- | -------- | ------------------------------------------------------------------------------------------------- |
| title       | n/a     | string   | true     | Title of the issue                                                                                |
| repository  | n/a     | string   | true     | Repository in which the issue should be created, using the format `org/repo`                      |
| children    | n/a     | Issue[]  | true     | Children issues to create                                                                         |
| id          | n/a     | string   | false    | Self-defined id for the issue, used to reference that issue from the description of other issues. |
| description | n/a     | string   | false    | Description of the issue, in Markdown. Use multi-line with the `                                  |
| milestone   | n/a     | string   | false    | Milestone to attach to the issue                                                                  |
| project     | n/a     | Project  | false    | Project to attach to the issue                                                                    |
| type        | n/a     | string   | false    | Issue type of the issue                                                                           |
| labels      | n/a     | string[] | false    | Label(s) to add to the issue                                                                      |
| assignees   | n/a     | string[] | false    | Assignees to add to the issue                                                                     |

### Linking to other issues

This is very similar to variables, define an id in one of the issues, and refer
to that id from other descriptions using `{{ id.myIssue }}` (only the
description field is supported).

```yaml
issues:
  - title: Release codebase
    id: myIssue
    repo: org/repo
  - title: A second issue
    description: This is a link to the first issue {{ id.myIssue }}
    repo: org/repo
```

### Project

| Parameter | Default | Type   | Description                                        |
| --------- | ------- | ------ | -------------------------------------------------- |
| title     | n/a     | string | Title of an opened project to attach this issue to |
| status    | n/a     | string | Status of the issue in the project                 |

# How to contribute

- Fork the repository
- npm install
- Rename .env.example into .env
- Update the INPUT\_ variables
- Do your changes
- npx local-action . src/main.ts .env
- npm run bundle
- npm test
- PR into this repository, detailing your changes

More details about GitHub TypeScript action are
[available here](https://github.com/actions/typescript-action)
