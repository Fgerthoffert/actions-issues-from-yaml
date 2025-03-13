import { addVariablesToIssues } from '../src/utils/addVariablesToIssues'

describe('addVariablesToIssues', () => {
  const variables = [
    { name: 'sw_release', value: '8.2.0.1' },
    { name: 'myOtherVar', value: 'This is another value' }
  ]

  const issues = [
    {
      title: 'My issue 1 - ${{ var.sw_release }}',
      repository: 'Org/repo',
      description: 'Line 1\nLine 2 - ${{ var.myOtherVar }}',
      milestone: 'milestone 1.2.3',
      type: 'Release',
      project: {
        title: 'test project',
        status: 'done'
      },
      children: [],
      labels: ['bug', 'enhancement'],
      assignees: ['userA', 'userB'],
      id: undefined,
      github: undefined
    }
  ]

  it('should replace variables in issue fields', () => {
    const updatedIssues = addVariablesToIssues(issues, variables)

    expect(updatedIssues[0].title).toBe('My issue 1 - 8.2.0.1')
    expect(updatedIssues[0].description).toBe(
      'Line 1\nLine 2 - This is another value'
    )
    expect(updatedIssues[0].milestone).toBe('milestone 1.2.3')
    expect(updatedIssues[0].type).toBe('Release')
    expect(updatedIssues[0].labels).toEqual(['bug', 'enhancement'])
    expect(updatedIssues[0].assignees).toEqual(['userA', 'userB'])
  })

  it('should handle issues without optional fields', () => {
    const minimalIssues = [
      {
        title: 'My issue 2 - ${{ var.sw_release }}',
        repository: 'Org/repo',
        description: undefined,
        milestone: undefined,
        type: undefined,
        project: undefined,
        children: [],
        labels: [],
        assignees: [],
        id: undefined,
        github: undefined
      }
    ]

    const updatedIssues = addVariablesToIssues(minimalIssues, variables)

    expect(updatedIssues[0].title).toBe('My issue 2 - 8.2.0.1')
    expect(updatedIssues[0].description).toBeUndefined()
    expect(updatedIssues[0].milestone).toBeUndefined()
    expect(updatedIssues[0].type).toBeUndefined()
    expect(updatedIssues[0].project).toBeUndefined()
    expect(updatedIssues[0].labels).toEqual([])
    expect(updatedIssues[0].assignees).toEqual([])
  })
})
