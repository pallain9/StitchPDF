#!/usr/bin/env node

// StitchPDF Free Tier CLI
// Basic PDF processing commands

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import path from 'path';

// Import free tier functions only
import { 
    extractText, 
    extractTextWithCoordinates,
    analyzeFonts,
    validatePdf,
    insertAtPage,
    showPremiumInfo
} from '../src/index.js';

console.log(chalk.blue(`
📄 StitchPDF Free Tier CLI v1.0.0
Open Source PDF Processing

🆓 FREE Features Available:
• Text extraction with coordinates
• Font analysis and detection  
• PDF security validation
• Basic page insertion

💎 Want premium features? Visit https://stitchpdf.com/pricing
`));

const argv = yargs(hideBin(process.argv))
    .scriptName('stitchpdf')
    .usage('$0 <command> [options]')
    
    // Text Extraction Commands
    .command('extract <pdf>', 'Extract text from PDF', (yargs) => {
        yargs
            .positional('pdf', {
                describe: 'PDF file path',
                type: 'string'
            })
            .option('coordinates', {
                alias: 'c',
                type: 'boolean',
                description: 'Include text coordinates'
            })
            .option('output', {
                alias: 'o',
                type: 'string',
                description: 'Output file path'
            });
    }, async (argv) => {
        try {
            console.log(chalk.yellow(`📄 Extracting text from: ${argv.pdf}`));
            
            const result = argv.coordinates ? 
                await extractTextWithCoordinates(argv.pdf) :
                await extractText(argv.pdf);
            
            if (argv.output) {
                const fs = await import('fs/promises');
                await fs.writeFile(argv.output, JSON.stringify(result, null, 2));
                console.log(chalk.green(`✅ Text saved to: ${argv.output}`));
            } else {
                console.log(chalk.cyan('\n📝 Extracted Text:'));
                if (argv.coordinates) {
                    result.pages.forEach((page, index) => {
                        console.log(chalk.dim(`\n--- Page ${index + 1} ---`));
                        page.textItems.forEach(item => {
                            console.log(`"${item.str}" at (${item.x}, ${item.y})`);
                        });
                    });
                } else {
                    console.log(result);
                }
            }
        } catch (error) {
            console.error(chalk.red(`❌ Error: ${error.message}`));
            process.exit(1);
        }
    })
    
    // Font Analysis Commands
    .command('fonts <pdf>', 'Analyze fonts in PDF', (yargs) => {
        yargs
            .positional('pdf', {
                describe: 'PDF file path',
                type: 'string'
            })
            .option('output', {
                alias: 'o',
                type: 'string',
                description: 'Output JSON file path'
            });
    }, async (argv) => {
        try {
            console.log(chalk.yellow(`🔤 Analyzing fonts in: ${argv.pdf}`));
            
            const fonts = await analyzeFonts(argv.pdf);
            
            if (argv.output) {
                const fs = await import('fs/promises');
                await fs.writeFile(argv.output, JSON.stringify(fonts, null, 2));
                console.log(chalk.green(`✅ Font analysis saved to: ${argv.output}`));
            } else {
                console.log(chalk.cyan('\n🔤 Font Analysis:'));
                console.log(`📊 Total fonts: ${fonts.totalFonts}`);
                console.log(`📚 Unique families: ${fonts.uniqueFamilies}`);
                console.log(`💾 Embedded fonts: ${fonts.embeddedFonts}`);
                console.log(`📝 Font details:`, fonts.fontDetails);
            }
        } catch (error) {
            console.error(chalk.red(`❌ Error: ${error.message}`));
            process.exit(1);
        }
    })
    
    // PDF Validation Commands
    .command('validate <pdf>', 'Validate PDF security and structure', (yargs) => {
        yargs
            .positional('pdf', {
                describe: 'PDF file path',
                type: 'string'
            })
            .option('output', {
                alias: 'o',
                type: 'string',
                description: 'Output JSON file path'
            });
    }, async (argv) => {
        try {
            console.log(chalk.yellow(`🔍 Validating PDF: ${argv.pdf}`));
            
            const validation = await validatePdf(argv.pdf);
            
            if (argv.output) {
                const fs = await import('fs/promises');
                await fs.writeFile(argv.output, JSON.stringify(validation, null, 2));
                console.log(chalk.green(`✅ Validation report saved to: ${argv.output}`));
            } else {
                console.log(chalk.cyan('\n🔍 Validation Results:'));
                console.log(`✅ Valid PDF: ${validation.isValid}`);
                console.log(`🔒 Security status: ${validation.securityStatus}`);
                if (validation.warnings.length > 0) {
                    console.log(chalk.yellow('⚠️  Warnings:'));
                    validation.warnings.forEach(warning => {
                        console.log(`  • ${warning}`);
                    });
                }
            }
        } catch (error) {
            console.error(chalk.red(`❌ Error: ${error.message}`));
            process.exit(1);
        }
    })
    
    // Basic Page Insertion
    .command('insert <target> <source>', 'Insert pages into PDF', (yargs) => {
        yargs
            .positional('target', {
                describe: 'Target PDF file path',
                type: 'string'
            })
            .positional('source', {
                describe: 'PDF file to insert',
                type: 'string'
            })
            .option('page', {
                alias: 'p',
                type: 'number',
                description: 'Page number to insert at (1-based)',
                default: 1
            })
            .option('output', {
                alias: 'o',
                type: 'string',
                description: 'Output file path',
                demandOption: true
            });
    }, async (argv) => {
        try {
            console.log(chalk.yellow(`📄 Inserting ${argv.source} into ${argv.target} at page ${argv.page}`));
            
            const result = await insertAtPage(argv.target, argv.source, argv.page, argv.output);
            
            console.log(chalk.green(`✅ Pages inserted successfully!`));
            console.log(chalk.cyan(`💾 Output saved to: ${result}`));
            
            // Promote premium conditional insertion
            console.log(chalk.dim(`\n💡 Need smart conditional insertion? Try @stitchpdf/premium`));
        } catch (error) {
            console.error(chalk.red(`❌ Error: ${error.message}`));
            process.exit(1);
        }
    })
    
    // Premium feature promotion
    .command('premium', 'Show premium features', () => {}, () => {
        showPremiumInfo();
        console.log(chalk.blue(`
💎 Premium Features Available:

📊 PDF Optimization:
  stitchpdf-premium optimize input.pdf --output optimized.pdf

📧 Mail Merge:
  stitchpdf-premium mailmerge template.pdf data.csv --output merged/

🎯 Smart Insertion:
  stitchpdf-premium insert-conditional target.pdf source.pdf --pattern "Invoice"

⚡ Bulk Processing:
  stitchpdf-premium batch-optimize folder/ --output optimized/

Get started: npm install @stitchpdf/premium
        `));
    })
    
    // Help and version
    .version('1.0.0')
    .help()
    .alias('help', 'h')
    .demandCommand(1, 'You need at least one command before moving on')
    .strict()
    .argv; 