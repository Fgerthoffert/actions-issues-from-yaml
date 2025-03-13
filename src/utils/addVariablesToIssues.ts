import * as core from '@actions/core'

const updateField = (
  field: string,
  fieldValue: string,
  variables: ConfigVariables[]
) => {
  const originalFieldValue = fieldValue
  if (fieldValue !== undefined) {
    for (const variable of variables) {
      fieldValue = fieldValue.replace(
        `{{ var.${variable.name} }}`,
        variable.value
      )
    }
  }
  if (originalFieldValue !== fieldValue) {
    core.debug(`field: ${field} - value updated`)
  } else {
    core.debug(`field: ${field} - no value update needed`)
  }
  return fieldValue
}

export function addVariablesToIssues(
  issues: ConfigIssue[],
  variables: ConfigVariables[]
): ConfigIssue[] {
  return issues.map((issue: ConfigIssue) => {
    core.info(`Adding variables to issue: ${issue.title}`)
    const updatedIssue: ConfigIssue = {
      ...issue,
      title: updateField('issue.title', issue.title, variables),
      repository: updateField('issue.repository', issue.repository, variables),
      description: issue.description
        ? updateField('issue.description', issue.description, variables)
        : undefined,
      milestone: issue.milestone
        ? updateField('issue.milestone', issue.milestone, variables)
        : undefined,
      type: issue.type
        ? updateField('issue.type', issue.type, variables)
        : undefined,
      project: issue.project
        ? {
            title: updateField(
              'issue.project.title',
              issue.project.title,
              variables
            ),
            status: issue.project.status
              ? updateField(
                  'issue.project.status',
                  issue.project.status,
                  variables
                )
              : undefined
          }
        : undefined,
      children:
        issue.children && issue.children.length > 0
          ? addVariablesToIssues(issue.children, variables)
          : [],
      labels:
        issue.labels && issue.labels.length > 0
          ? issue.labels.map((label: string) =>
              updateField('label', label, variables)
            )
          : [],
      assignees:
        issue.assignees && issue.assignees.length > 0
          ? issue.assignees.map((assignee: string) =>
              updateField('assignee', assignee, variables)
            )
          : []
    }
    return updatedIssue
  })
}
