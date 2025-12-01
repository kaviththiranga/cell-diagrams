/**
 * Document Manager
 *
 * Manages open documents and their parsed state for the language server.
 */

import { TextDocument } from 'vscode-languageserver-textdocument';
import {
  parseWithRecovery,
  type Program,
  type EnhancedParseError,
  type EnhancedParseResult,
} from '@cell-diagrams/core';
import type { SymbolTable } from '../analysis/symbol-table';
import { buildSymbolTable } from '../analysis/symbol-table';

/**
 * Cached document state with parsed AST and symbols
 */
export interface DocumentState {
  /** The text document */
  document: TextDocument;
  /** Parse result from core */
  parseResult: EnhancedParseResult;
  /** Symbol table for cross-references */
  symbolTable: SymbolTable;
  /** Timestamp of last parse */
  lastParsed: number;
}

/**
 * Manages document state including parsing and symbol tables
 */
export class DocumentManager {
  private documents: Map<string, DocumentState> = new Map();

  /**
   * Get the state for a document, parsing if needed
   */
  getState(document: TextDocument): DocumentState {
    const uri = document.uri;
    const existing = this.documents.get(uri);

    // Return cached state if document hasn't changed
    if (existing && existing.document.version === document.version) {
      return existing;
    }

    // Parse and cache new state
    const state = this.parseDocument(document);
    this.documents.set(uri, state);
    return state;
  }

  /**
   * Get state for a document by URI
   */
  getStateByUri(uri: string): DocumentState | undefined {
    return this.documents.get(uri);
  }

  /**
   * Update a document and reparse
   */
  update(document: TextDocument): DocumentState {
    const state = this.parseDocument(document);
    this.documents.set(document.uri, state);
    return state;
  }

  /**
   * Remove a document from the manager
   */
  remove(uri: string): void {
    this.documents.delete(uri);
  }

  /**
   * Check if a document is managed
   */
  has(uri: string): boolean {
    return this.documents.has(uri);
  }

  /**
   * Get all managed documents
   */
  all(): DocumentState[] {
    return Array.from(this.documents.values());
  }

  /**
   * Get the AST for a document
   */
  getAst(uri: string): Program | undefined {
    return this.documents.get(uri)?.parseResult.ast;
  }

  /**
   * Get errors for a document
   */
  getErrors(uri: string): EnhancedParseError[] {
    return this.documents.get(uri)?.parseResult.errors ?? [];
  }

  /**
   * Get the symbol table for a document
   */
  getSymbolTable(uri: string): SymbolTable | undefined {
    return this.documents.get(uri)?.symbolTable;
  }

  /**
   * Parse a document and build its state
   */
  private parseDocument(document: TextDocument): DocumentState {
    const content = document.getText();
    const parseResult = parseWithRecovery(content);
    const symbolTable = buildSymbolTable(parseResult.ast, document.uri);

    return {
      document,
      parseResult,
      symbolTable,
      lastParsed: Date.now(),
    };
  }
}
