# Cell Diagrams for VS Code

Cell-Based Architecture diagram support for Visual Studio Code.

## Features

- **Syntax Highlighting** - Full syntax highlighting for `.cell` files
- **Diagnostics** - Real-time error detection and reporting
- **Diagram Preview** - Visual preview of your cell architecture

## Usage

1. Create a file with the `.cell` extension
2. Write your Cell Diagrams DSL code
3. Press `Cmd+K V` (Mac) or `Ctrl+K V` (Windows/Linux) to open the diagram preview

## Example

```cell
cell OrderCell {
  name: "Order Management"
  type: logic

  components {
    ms OrderService
    db OrderDB
    gw OrderGateway
  }

  connect {
    OrderGateway -> OrderService
    OrderService -> OrderDB
  }

  expose {
    api: OrderGateway
  }
}

external Stripe {
  name: "Stripe Payment"
  type: saas
}

user Customer [type: external]

connect OrderCell -> Stripe [label: "Process Payment"]
connect Customer -> OrderCell
```

## Commands

- **Cell Diagrams: Show Diagram Preview** - Open preview in current column
- **Cell Diagrams: Show Diagram Preview to Side** - Open preview in adjacent column

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `cellDiagrams.preview.autoRefresh` | `true` | Auto-refresh preview on changes |
| `cellDiagrams.preview.refreshDelay` | `300` | Delay before refresh (ms) |
| `cellDiagrams.diagram.direction` | `TB` | Default layout direction |

## Keyboard Shortcuts

| Shortcut | Command |
|----------|---------|
| `Cmd+K V` / `Ctrl+K V` | Show Preview to Side |

## License

MIT
