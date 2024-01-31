// @ts-ignore
import MockedSocket from 'socket.io-mock'
import FileTreeRoot from '../../../../../frontend/js/features/file-tree/components/file-tree-root'
import { EditorProviders } from '../../../helpers/editor-providers'

describe('<FileTreeRoot/>', function () {
  beforeEach(function () {
    cy.window().then(win => {
      win.metaAttributesCache.set('ol-user', { id: 'user1' })
    })
  })

  it('renders', function () {
    const rootFolder = [
      {
        _id: 'root-folder-id',
        name: 'rootFolder',
        docs: [{ _id: '456def', name: 'main.tex' }],
        folders: [],
        fileRefs: [],
      },
    ]

    cy.mount(
      <EditorProviders
        rootFolder={rootFolder as any}
        projectId="123abc"
        rootDocId="456def"
        features={{} as any}
        permissionsLevel="owner"
      >
        <FileTreeRoot
          refProviders={{}}
          reindexReferences={cy.stub()}
          setRefProviderEnabled={cy.stub()}
          setStartedFreeTrial={cy.stub()}
          onSelect={cy.stub()}
          onInit={cy.stub()}
          isConnected
        />
      </EditorProviders>
    )

    cy.findByRole('tree')
    cy.findByRole('treeitem')
    cy.findByRole('treeitem', { name: 'main.tex', selected: true })
    cy.get('.disconnected-overlay').should('not.exist')
  })

  it('renders with invalid selected doc in local storage', function () {
    global.localStorage.setItem(
      'doc.open_id.123abc',
      JSON.stringify('not-a-valid-id')
    )

    const rootFolder = [
      {
        _id: 'root-folder-id',
        name: 'rootFolder',
        docs: [{ _id: '456def', name: 'main.tex' }],
        folders: [],
        fileRefs: [],
      },
    ]

    cy.mount(
      <EditorProviders
        rootFolder={rootFolder as any}
        projectId="123abc"
        rootDocId="456def"
        features={{} as any}
        permissionsLevel="owner"
      >
        <FileTreeRoot
          refProviders={{}}
          reindexReferences={cy.stub()}
          setRefProviderEnabled={cy.stub()}
          setStartedFreeTrial={cy.stub()}
          onSelect={cy.stub()}
          onInit={cy.stub()}
          isConnected
        />
      </EditorProviders>
    )

    // as a proxy to check that the invalid entity has not been select we start
    // a delete and ensure the modal is displayed (the cancel button can be
    // selected) This is needed to make sure the test fail.
    cy.findByRole('treeitem', { name: 'main.tex' }).click({
      ctrlKey: true,
      cmdKey: true,
    })
    cy.findByRole('button', { name: 'Menu' }).click()
    cy.findByRole('menuitem', { name: 'Delete' }).click()
    cy.findByRole('button', { name: 'Cancel' })
  })

  it('renders disconnected overlay', function () {
    const rootFolder = [
      {
        _id: 'root-folder-id',
        name: 'rootFolder',
        docs: [{ _id: '456def', name: 'main.tex' }],
        folders: [],
        fileRefs: [],
      },
    ]

    cy.mount(
      <EditorProviders
        rootFolder={rootFolder as any}
        projectId="123abc"
        rootDocId="456def"
        features={{} as any}
        permissionsLevel="owner"
      >
        <FileTreeRoot
          refProviders={{}}
          reindexReferences={cy.stub()}
          setRefProviderEnabled={cy.stub()}
          setStartedFreeTrial={cy.stub()}
          onSelect={cy.stub()}
          onInit={cy.stub()}
          isConnected={false}
        />
      </EditorProviders>
    )

    cy.get('.disconnected-overlay')
  })

  it('fire onSelect', function () {
    const rootFolder = [
      {
        _id: 'root-folder-id',
        name: 'rootFolder',
        docs: [
          { _id: '456def', name: 'main.tex' },
          { _id: '789ghi', name: 'other.tex' },
        ],
        folders: [],
        fileRefs: [],
      },
    ]

    cy.mount(
      <EditorProviders
        rootFolder={rootFolder as any}
        projectId="123abc"
        rootDocId="456def"
        features={{} as any}
        permissionsLevel="readOnly"
      >
        <FileTreeRoot
          refProviders={{}}
          reindexReferences={cy.stub()}
          setRefProviderEnabled={cy.stub()}
          setStartedFreeTrial={cy.stub()}
          onSelect={cy.stub().as('onSelect')}
          onInit={cy.stub()}
          isConnected
        />
      </EditorProviders>
    )

    cy.get('@onSelect').should('have.been.calledOnceWith', [
      Cypress.sinon.match({
        entity: Cypress.sinon.match({ _id: '456def', name: 'main.tex' }),
      }),
    ])
    cy.findByRole('tree')
    cy.findByRole('treeitem', { name: 'other.tex' }).click()
    cy.get('@onSelect').should('have.been.calledWith', [
      Cypress.sinon.match({
        entity: Cypress.sinon.match({ _id: '789ghi', name: 'other.tex' }),
      }),
    ])
  })

  it('listen to editor.openDoc', function () {
    const rootFolder = [
      {
        _id: 'root-folder-id',
        name: 'rootFolder',
        docs: [
          { _id: '456def', name: 'main.tex' },
          { _id: '789ghi', name: 'other.tex' },
        ],
        folders: [],
        fileRefs: [],
      },
    ]

    cy.mount(
      <EditorProviders
        rootFolder={rootFolder as any}
        projectId="123abc"
        rootDocId="456def"
        features={{} as any}
        permissionsLevel="readOnly"
      >
        <FileTreeRoot
          refProviders={{}}
          reindexReferences={cy.stub()}
          setRefProviderEnabled={cy.stub()}
          setStartedFreeTrial={cy.stub()}
          onSelect={cy.stub()}
          onInit={cy.stub()}
          isConnected
        />
      </EditorProviders>
    )

    cy.findByRole('treeitem', { name: 'main.tex', selected: true })

    // entities not found should be ignored
    cy.document().trigger('editor.openDoc', { detail: 'not-an-id' })
    cy.findByRole('treeitem', { name: 'main.tex', selected: true })

    cy.document().trigger('editor.openDoc', { detail: '789ghi' })
    cy.findByRole('treeitem', { name: 'main.tex', selected: false })
    cy.findByRole('treeitem', { name: 'other.tex', selected: true })
  })

  it('only shows a menu button when a single item is selected', function () {
    const rootFolder = [
      {
        _id: 'root-folder-id',
        name: 'rootFolder',
        docs: [
          { _id: '456def', name: 'main.tex' },
          { _id: '789ghi', name: 'other.tex' },
        ],
        folders: [],
        fileRefs: [],
      },
    ]

    cy.mount(
      <EditorProviders
        rootFolder={rootFolder as any}
        projectId="123abc"
        rootDocId="456def"
        features={{} as any}
        permissionsLevel="owner"
      >
        <FileTreeRoot
          refProviders={{}}
          reindexReferences={cy.stub()}
          setRefProviderEnabled={cy.stub()}
          setStartedFreeTrial={cy.stub()}
          onSelect={cy.stub()}
          onInit={cy.stub()}
          isConnected
        />
      </EditorProviders>
    )

    cy.findByRole('treeitem', { name: 'main.tex', selected: true })
    cy.findByRole('treeitem', { name: 'other.tex', selected: false })

    // single item selected: menu button is visible
    cy.findAllByRole('button', { name: 'Menu' }).should('have.length', 1)

    // select the other item
    cy.findByRole('treeitem', { name: 'other.tex' }).click()

    cy.findByRole('treeitem', { name: 'main.tex', selected: false })
    cy.findByRole('treeitem', { name: 'other.tex', selected: true })

    // single item selected: menu button is visible
    cy.findAllByRole('button', { name: 'Menu' }).should('have.length', 1)

    // multi-select the main item
    cy.findByRole('treeitem', { name: 'main.tex' }).click({
      ctrlKey: true,
      cmdKey: true,
    })

    cy.findByRole('treeitem', { name: 'main.tex', selected: true })
    cy.findByRole('treeitem', { name: 'other.tex', selected: true })

    // multiple items selected: no menu button is visible
    cy.findAllByRole('button', { name: 'Menu' }).should('have.length', 0)
  })

  describe('when deselecting files', function () {
    beforeEach(function () {
      const rootFolder = [
        {
          _id: 'root-folder-id',
          name: 'rootFolder',
          docs: [{ _id: '123abc', name: 'main.tex' }],
          folders: [
            {
              _id: '789ghi',
              name: 'thefolder',
              docs: [{ _id: '456def', name: 'sub.tex' }],
              fileRefs: [],
              folders: [],
            },
          ],
          fileRefs: [],
        },
      ]

      cy.mount(
        <EditorProviders
          rootFolder={rootFolder as any}
          projectId="123abc"
          rootDocId="456def"
          features={{} as any}
          permissionsLevel="owner"
          socket={new MockedSocket()}
        >
          <FileTreeRoot
            refProviders={{}}
            reindexReferences={cy.stub()}
            setRefProviderEnabled={cy.stub()}
            setStartedFreeTrial={cy.stub()}
            onSelect={cy.stub()}
            onInit={cy.stub()}
            isConnected
          />
        </EditorProviders>
      )

      // select the sub file
      cy.findByRole('treeitem', { name: 'sub.tex' }).click()
      cy.findByRole('treeitem', { name: 'sub.tex' }).should(
        'have.attr',
        'aria-selected',
        'true'
      )

      // click on empty area (after giving it extra height below the tree)
      cy.findByTestId('file-tree-inner')
        .invoke('attr', 'style', 'height: 400px')
        .click()
    })

    it('removes the selected indicator', function () {
      cy.findByRole('treeitem', { selected: true }).should('not.exist')
    })

    it('disables the "rename" and "delete" buttons', function () {
      cy.findByRole('button', { name: 'Rename' }).should('not.exist')
      cy.findByRole('button', { name: 'Delete' }).should('not.exist')
    })

    it('creates new file in the root folder', function () {
      cy.intercept('project/*/doc', { statusCode: 200 })

      cy.findByRole('button', { name: /new file/i }).click()
      cy.findByRole('button', { name: /create/i }).click()

      cy.window().then(win => {
        // @ts-ignore
        win._ide.socket.socketClient.emit('reciveNewDoc', 'root-folder-id', {
          _id: '12345',
          name: 'abcdef.tex',
          docs: [],
          fileRefs: [],
          folders: [],
        })
      })

      cy.findByRole('treeitem', { name: 'abcdef.tex' }).then($itemEl => {
        cy.findByTestId('file-tree-list-root').then($rootEl => {
          expect($itemEl.get(0).parentNode).to.equal($rootEl.get(0))
        })
      })
    })

    it('starts a new selection', function () {
      cy.findByRole('treeitem', { name: 'sub.tex' }).should(
        'have.attr',
        'aria-selected',
        'false'
      )

      cy.findByRole('treeitem', { name: 'main.tex' }).click({
        ctrlKey: true,
        cmdKey: true,
      })

      cy.findByRole('treeitem', { name: 'main.tex' }).should(
        'have.attr',
        'aria-selected',
        'true'
      )
    })
  })
})
