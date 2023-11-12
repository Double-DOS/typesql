// Import typescript to work with AST (Abstract Syntax Tree)
import ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import { IValidSchemaInterface } from "./IValidSchemaInterface";
import { typing } from "./typing-enum";
import {
  clearSelectedSchemaInterfaces,
  findAllInterfaceDeclarationsFromSourceFile,
  getValidSchemaInterfaces,
  selectValidSchemaInterfaces,
} from "./valid-interface-selector";
import { convertInterfaceToGraphQLSchema } from "./schema-generator";
var graphQLSchemasInFolder: string[] = [];

function generateSourceFileFromSourceCode(sourceCode: string): ts.SourceFile {
  2;
  const sourceFile = ts.createSourceFile(
    "temp.ts",
    sourceCode,
    ts.ScriptTarget.Latest
  );

  return sourceFile;
}

function parseFileToSourceCode(filePath: string): string {
  // Read TypeScript code from a file
  const sourceCode = fs.readFileSync(filePath, "utf-8");

  // Print the parsed source code
  return sourceCode;
}

function readFilesInFolder(folderPath: string): string[] {
  try {
    // Get the list of files in the folder
    const files = fs.readdirSync(folderPath);

    // Filter out only files (not directories)
    const filePaths = files
      .map((file) => path.join(folderPath, file))
      .filter((filePath) => fs.statSync(filePath).isFile());

    return filePaths;
  } catch (error: any) {
    console.error(
      `Error reading files in folder ${folderPath}: ${error.message}`
    );
    return [];
  }
}

function getValidSchemaInterfacesPerSourceFile(sourceFile: ts.SourceFile) {
  const interfacesInSourceFile =
    findAllInterfaceDeclarationsFromSourceFile(sourceFile);
  selectValidSchemaInterfaces(interfacesInSourceFile, sourceFile);
}

function getGraphQLFromValidSchemaInterfaces() {
  const validSchemaInterfaces = getValidSchemaInterfaces();
  validSchemaInterfaces.forEach((schemaInterface) => {
    const graphQLSchema = convertInterfaceToGraphQLSchema(schemaInterface);
    graphQLSchemasInFolder.push(graphQLSchema);
  });
}

function writeToFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, "utf-8");
}

function createGraphQLFile(appName: string, interfaceFolderPath: string) {
  // todo: use appName to generate the graph file in the folderPath specified
  const graphQLFileName = `${appName}.graphql`;
  const graphQLFilePath = path.join(interfaceFolderPath, graphQLFileName);
  const graphQLFileContent = `"""\nGraphQL Schema Generated by typesql library from path: ${interfaceFolderPath}\n\nModifying this file will not have any effect as it will be regenerated on server startup.\n"""\n${graphQLSchemasInFolder.join(
    "\n\n"
  )}\n`;
  writeToFile(graphQLFilePath, graphQLFileContent);
}

export function generateGraphQLSchema(
  interfaceFolderPath: string,
  appName: string
) {
  const filePaths = readFilesInFolder(interfaceFolderPath);
  filePaths.forEach((filePath) => {
    const sourceCode = parseFileToSourceCode(filePath);
    const sourceFile = generateSourceFileFromSourceCode(sourceCode);
    getValidSchemaInterfacesPerSourceFile(sourceFile);
  });
  getGraphQLFromValidSchemaInterfaces();
  createGraphQLFile(appName, interfaceFolderPath);
  clearSelectedSchemaInterfaces();
}
