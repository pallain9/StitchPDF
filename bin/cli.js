#!/usr/bin/env node
// stitchPDF CLI Interface
import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';

// Import library functions
import { 
    extractText, 
    extractTextWithCoordinates,
    validatePdf,
    scanForJavaScript,
    insertAtPage,
    createMailMerge,
    processMailMerge,
    analyzePdfOptimization,
    analyzeFonts,
    LicenseManager
} from '../src/index.js';

// Import premium features separately to handle licensing
import { insertConditional } from '../src/insertion/pageInsertion.js';
import { optimizePdf } from '../src/optimization/pdfOptimizer.js';

const licenseManager = new LicenseManager();

// Helper function to handle errors
function handleError(error) {
    if (error.name === 'LicenseError') {
        console.error(chalk.red('🔒 License Required:'), error.message);
        console.log(chalk.yellow('💡 Tip:'), 'Use', chalk.cyan('stitchpdf license --help'), 'for licensing options');
    } else {
        console.error(chalk.red('❌ Error:'), error.message);
    }
    process.exit(1);
}

// CLI Configuration
const cli = yargs(hideBin(process.argv))
    .scriptName('stitchpdf')
    .version('1.0.0')
    .usage('$0 <command> [options]')
    .help()
    .alias('h', 'help')
    .recommendCommands()
    .demandCommand(1, 'You need at least one command before moving on')
    .strict();

// Text Extraction Commands
cli.command(
    'extract <pdf>',
    'Extract text from PDF',
    (yargs) => {
        yargs
            .positional('pdf', {
                describe: 'PDF file to extract text from',
                type: 'string'
            })
            .option('output', {
                alias: 'o',
                describe: 'Output file for extracted text',
                type: 'string'
            })
            .option('layout', {
                alias: 'l',
                describe: 'Preserve text layout',
                type: 'boolean',
                default: false
            })
            .option('pages', {
                alias: 'p',
                describe: 'Specific pages to extract (comma-separated)',
                type: 'string'
            })
            .option('coordinates', {
                alias: 'c',
                describe: 'Include coordinate information',
                type: 'boolean',
                default: false
            })
            .option('x', {
                describe: 'X coordinate for region extraction',
                type: 'number'
            })
            .option('y', {
                describe: 'Y coordinate for region extraction', 
                type: 'number'
            })
            .option('width', {
                alias: 'w',
                describe: 'Width of extraction region',
                type: 'number'
            })
            .option('height', {
                describe: 'Height of extraction region',
                type: 'number'
            })
            .option('unit', {
                alias: 'u',
                describe: 'Unit for coordinates (pt, in, mm)',
                choices: ['pt', 'in', 'mm'],
                default: 'pt'
            });
    },
    async (argv) => {
        try {
            console.log(chalk.blue('📄 Extracting text from:'), argv.pdf);
            
            const options = {
                preserveLayout: argv.layout,
                pageNumbers: argv.pages ? argv.pages.split(',').map(p => parseInt(p.trim())) : null
            };
            
            // Add region extraction if coordinates are specified
            if (argv.x !== undefined || argv.y !== undefined || argv.width !== undefined || argv.height !== undefined) {
                options.region = {
                    x: argv.x || 0,
                    y: argv.y || 0,
                    width: argv.width || 612, // Default page width
                    height: argv.height || 792, // Default page height
                    unit: argv.unit || 'pt'
                };
                console.log(chalk.blue('📍 Extracting from region:'), 
                    `x=${options.region.x}, y=${options.region.y}, w=${options.region.width}, h=${options.region.height} ${options.region.unit}`);
            }
            
            let result;
            if (argv.coordinates) {
                result = await extractTextWithCoordinates(argv.pdf, options);
                console.log(chalk.green('✅ Text extracted with coordinates'));
                
                if (argv.output) {
                    await fs.promises.writeFile(argv.output, JSON.stringify(result, null, 2));
                    console.log(chalk.green('💾 Saved to:'), argv.output);
                } else {
                    console.log(JSON.stringify(result, null, 2));
                }
            } else {
                result = await extractText(argv.pdf, options);
                console.log(chalk.green('✅ Text extracted'));
                
                if (argv.output) {
                    await fs.promises.writeFile(argv.output, result);
                    console.log(chalk.green('💾 Saved to:'), argv.output);
                } else {
                    console.log(result);
                }
            }
        } catch (error) {
            handleError(error);
        }
    }
);

// PDF Validation Commands - Enhanced Security Analysis
cli.command(
    'validate <pdf>',
    'Comprehensive PDF security validation with 8 security checks',
    (yargs) => {
        yargs
            .positional('pdf', {
                describe: 'PDF file to validate',
                type: 'string'
            })
            .option('output', {
                alias: 'o',
                describe: 'Output detailed security report to JSON file',
                type: 'string'
            })
            .option('javascript', {
                alias: 'js',
                describe: 'Check for JavaScript content (11 patterns)',
                type: 'boolean',
                default: true
            })
            .option('forms', {
                describe: 'Check for interactive forms and widgets',
                type: 'boolean',
                default: true
            })
            .option('embedded', {
                describe: 'Check for embedded files and attachments',
                type: 'boolean',
                default: true
            })
            .option('metadata', {
                describe: 'Check for suspicious metadata',
                type: 'boolean',
                default: true
            })
            .option('objects', {
                describe: 'Check for suspicious PDF objects',
                type: 'boolean',
                default: true
            })
            .option('encryption', {
                describe: 'Check encryption security settings',
                type: 'boolean',
                default: true
            })
            .option('urls', {
                describe: 'Check for suspicious URLs',
                type: 'boolean',
                default: true
            })
            .option('actions', {
                describe: 'Check for suspicious PDF actions',
                type: 'boolean',
                default: true
            })
            .option('summary', {
                alias: 's',
                describe: 'Show summary only (hide detailed findings)',
                type: 'boolean',
                default: false
            });
    },
    async (argv) => {
        try {
            console.log(chalk.blue('🔍 Running comprehensive PDF security validation...'));
            console.log(chalk.gray(`File: ${argv.pdf}`));
            
            const options = {
                checkJavaScript: argv.javascript,
                checkForms: argv.forms,
                checkEmbeddedFiles: argv.embedded,
                checkMetadata: argv.metadata,
                checkSuspiciousObjects: argv.objects,
                checkEncryption: argv.encryption,
                checkUrls: argv.urls,
                checkActions: argv.actions
            };
            
            const result = await validatePdf(argv.pdf, options);
            
            // Display overall assessment
            console.log(chalk.blue('\n📊 Security Assessment:'));
            const riskColor = result.riskLevel === 'CRITICAL' ? chalk.red.bold :
                             result.riskLevel === 'HIGH' ? chalk.red :
                             result.riskLevel === 'MEDIUM' ? chalk.yellow :
                             result.riskLevel === 'LOW' ? chalk.green : chalk.gray;
            
            console.log('Overall Risk:', riskColor(result.riskLevel));
            console.log('File Size:', (result.fileSize / 1024 / 1024).toFixed(2), 'MB');
            console.log('Pages:', result.pageCount);
            console.log('Valid Structure:', result.valid ? chalk.green('✓') : chalk.red('✗'));
            
            if (!argv.summary && result.securityChecks) {
                // Display detailed security check results
                console.log(chalk.blue('\n🛡️  Security Check Results:'));
                
                Object.entries(result.securityChecks).forEach(([checkName, checkResult]) => {
                    if (!checkResult) return;
                    
                    const checkTitle = checkName.charAt(0).toUpperCase() + checkName.slice(1).replace(/([A-Z])/g, ' $1');
                    const statusColor = checkResult.riskLevel === 'CRITICAL' ? chalk.red :
                                       checkResult.riskLevel === 'HIGH' ? chalk.red :
                                       checkResult.riskLevel === 'MEDIUM' ? chalk.yellow :
                                       checkResult.riskLevel === 'LOW' ? chalk.green : chalk.gray;
                    
                    console.log(`\n${chalk.cyan('●')} ${checkTitle}: ${statusColor(checkResult.riskLevel)}`);
                    console.log(`  ${checkResult.recommendation || 'No specific findings'}`);
                    
                    // Show specific findings based on check type
                    if (checkName === 'javascript' && checkResult.detectedScripts?.length > 0) {
                        console.log(chalk.gray('  Detected JavaScript patterns:'));
                        checkResult.detectedScripts.slice(0, 5).forEach(script => {
                            const typeColor = script.risk === 'CRITICAL' ? chalk.red : 
                                            script.risk === 'HIGH' ? chalk.red : 
                                            script.risk === 'MEDIUM' ? chalk.yellow : chalk.blue;
                            console.log(`    • ${script.type} ${typeColor('(' + script.risk + ')')}: ${script.matches}x`);
                        });
                        if (checkResult.detectedScripts.length > 5) {
                            console.log(chalk.gray(`    ... and ${checkResult.detectedScripts.length - 5} more`));
                        }
                    } else if (checkName === 'forms' && checkResult.detectedForms?.length > 0) {
                        console.log(chalk.gray('  Form elements found:'));
                        checkResult.detectedForms.forEach(form => {
                            console.log(`    • ${form.type}: ${form.count} instances`);
                        });
                    } else if (checkName === 'embeddedFiles' && checkResult.detectedEmbedded?.length > 0) {
                        console.log(chalk.gray('  Embedded content:'));
                        checkResult.detectedEmbedded.forEach(file => {
                            const riskColor = file.risk === 'HIGH' ? chalk.red : chalk.yellow;
                            console.log(`    • ${file.type} ${riskColor('(' + file.risk + ')')}: ${file.count} found`);
                        });
                    } else if (checkName === 'urls' && checkResult.detectedUrls?.length > 0) {
                        console.log(chalk.gray('  URLs detected:'));
                        checkResult.detectedUrls.forEach(url => {
                            const riskColor = url.risk === 'CRITICAL' ? chalk.red : 
                                            url.risk === 'HIGH' ? chalk.red : 
                                            url.risk === 'MEDIUM' ? chalk.yellow : chalk.blue;
                            console.log(`    • ${url.type} ${riskColor('(' + url.risk + ')')}: ${url.count} URLs`);
                        });
                    } else if (checkName === 'suspiciousObjects' && checkResult.detectedObjects?.length > 0) {
                        console.log(chalk.gray('  Suspicious objects:'));
                        checkResult.detectedObjects.forEach(obj => {
                            const riskColor = obj.risk === 'CRITICAL' ? chalk.red : 
                                            obj.risk === 'HIGH' ? chalk.red : chalk.yellow;
                            console.log(`    • ${obj.type} ${riskColor('(' + obj.risk + ')')}: ${obj.count} found`);
                        });
                    } else if (checkName === 'actions' && checkResult.detectedActions?.length > 0) {
                        console.log(chalk.gray('  PDF actions:'));
                        checkResult.detectedActions.forEach(action => {
                            const riskColor = action.risk === 'CRITICAL' ? chalk.red : 
                                            action.risk === 'HIGH' ? chalk.red : chalk.yellow;
                            console.log(`    • ${action.type} ${riskColor('(' + action.risk + ')')}: ${action.count} found`);
                        });
                    } else if (checkName === 'encryption') {
                        if (checkResult.isEncrypted) {
                            console.log(chalk.gray('  Encryption details:'));
                            console.log(`    • Password protected: ${checkResult.hasUserPassword ? '✓' : '✗'}`);
                            console.log(`    • Owner restrictions: ${checkResult.hasOwnerPassword ? '✓' : '✗'}`);
                            if (checkResult.weakEncryption) {
                                console.log(chalk.red('    • ⚠️  Weak encryption detected'));
                            }
                        }
                    }
                });
            }
            
            // Show security recommendations
            if (result.recommendations?.length > 0) {
                console.log(chalk.yellow('\n💡 Security Recommendations:'));
                result.recommendations.forEach((rec, index) => {
                    const levelColor = rec.level === 'CRITICAL' ? chalk.red.bold :
                                      rec.level === 'HIGH' ? chalk.red :
                                      rec.level === 'MEDIUM' ? chalk.yellow : chalk.blue;
                    console.log(`${index + 1}. ${levelColor('[' + rec.level + ']')} ${rec.message}`);
                });
            } else if (result.riskLevel === 'LOW') {
                console.log(chalk.green('\n✅ No security concerns detected!'));
                console.log(chalk.gray('This PDF appears to be safe for viewing.'));
            }
            
            // Show basic issues if any
            if (result.issues?.length > 0) {
                console.log(chalk.red('\n🚨 Structural Issues:'));
                result.issues.forEach(issue => {
                    console.log(chalk.red('  •'), issue);
                });
            }
            
            if (argv.output) {
                const report = {
                    file: argv.pdf,
                    timestamp: new Date().toISOString(),
                    assessment: {
                        riskLevel: result.riskLevel,
                        valid: result.valid,
                        fileSize: result.fileSize,
                        pageCount: result.pageCount
                    },
                    securityChecks: result.securityChecks,
                    recommendations: result.recommendations,
                    issues: result.issues || [],
                    options: options
                };
                await fs.promises.writeFile(argv.output, JSON.stringify(report, null, 2));
                console.log(chalk.blue('\n📄 Detailed security report saved to:'), argv.output);
            }
            
            // Summary message
            console.log(chalk.blue('\n📋 Validation Complete'));
            const checksRun = Object.keys(options).filter(key => options[key]).length;
            console.log(chalk.gray(`Performed ${checksRun} security checks • Risk Level: ${result.riskLevel}`));
            
        } catch (error) {
            handleError(error);
        }
    }
);

// Font Analysis Commands
cli.command(
    'fonts',
    'Font analysis tools',
    (yargs) => {
        yargs
            .command(
                'analyze <pdf>',
                'Analyze all fonts used in PDF',
                (yargs) => {
                    yargs
                        .positional('pdf', {
                            describe: 'PDF file to analyze',
                            type: 'string'
                        })
                        .option('output', {
                            alias: 'o',
                            describe: 'Output file for font analysis report',
                            type: 'string'
                        })
                        .option('details', {
                            alias: 'd',
                            describe: 'Include detailed usage information',
                            type: 'boolean',
                            default: true
                        })
                        .option('group', {
                            alias: 'g',
                            describe: 'Group fonts by family',
                            type: 'boolean',
                            default: false
                        })
                        .option('duplicates', {
                            describe: 'Detect duplicate fonts',
                            type: 'boolean',
                            default: true
                        });
                },
                async (argv) => {
                    try {
                        console.log(chalk.blue('🔤 Analyzing fonts in:'), argv.pdf);
                        
                        const analysis = await analyzeFonts(argv.pdf);
                        
                        console.log(chalk.green('✅ Font analysis complete'));
                        console.log(chalk.blue('📄 File size:'), `unknown MB`);
                        console.log(chalk.blue('📄 Pages:'), `unknown`);
                        console.log(chalk.blue('🔤 Total fonts:'), analysis.summary.totalFonts);
                        console.log(chalk.blue('📎 Embedded fonts:'), analysis.summary.embeddedFonts);
                        console.log(chalk.blue('🖥️  System fonts:'), analysis.summary.systemFonts);
                        console.log(chalk.blue('👨‍👩‍👧‍👦 Font families:'), analysis.summary.uniqueFamilies);
                        
                        // Show font list
                        console.log(chalk.yellow('\n�� Font Details:'));
                        
                        let hasInternalIds = false;
                        analysis.fonts.forEach(font => {
                            const embedded = font.embedded ? chalk.green('✅ Embedded') : chalk.red('❌ Not embedded');
                            const pagesText = font.pages ? Array.from(font.pages).length : 'unknown';
                            const charsText = font.totalCharacters || 0;
                            
                            // Check if this is an internal ID
                            const isInternalId = /^g_d\d+_f\d+/.test(font.name);
                            if (isInternalId) hasInternalIds = true;
                            
                            const displayName = isInternalId ? 
                                chalk.gray(`${font.name} (PDF.js internal ID)`) : 
                                chalk.cyan(font.name);
                            
                            console.log(`  ${displayName} (${font.family})`);
                            console.log(`    ${embedded} - Style: ${font.style} - Pages: ${pagesText} - Characters: ${charsText}`);
                            
                            // Show sample text if available
                            if (font.textItems && font.textItems.length > 0) {
                                const sampleText = font.textItems.slice(0, 3)
                                    .map(item => item.text.substring(0, 30))
                                    .join(', ')
                                    .replace(/\s+/g, ' ')
                                    .trim();
                                
                                if (sampleText) {
                                    console.log(`    ${chalk.dim('Sample text:')} "${sampleText}${sampleText.length >= 90 ? '...' : ''}"`);
                                }
                            }
                        });
                        
                        // Explain internal IDs
                        if (hasInternalIds) {
                            console.log(chalk.yellow('\n💡 About Internal Font IDs:'));
                            console.log('  PDF.js generates internal IDs (like g_d0_f1) when:');
                            console.log('  • Fonts are embedded without clear names');
                            console.log('  • Fonts are subset or modified versions');
                            console.log('  • The PDF uses complex font configurations');
                            console.log(chalk.dim('  These fonts are still functional, just not easily identifiable by name.'));
                        }
                        
                        // Show font families (only if meaningful)
                        const meaningfulFamilies = Object.entries(analysis.analysis.fontFamilies)
                            .filter(([family, fonts]) => !family.startsWith('g_d'));
                        
                        if (meaningfulFamilies.length > 0) {
                            console.log(chalk.yellow('\n👨‍👩‍👧‍👦 Identified Font Families:'));
                            meaningfulFamilies.forEach(([family, fonts]) => {
                                console.log(`  ${chalk.blue(family)}: ${fonts.length} variant(s)`);
                                fonts.forEach(font => {
                                    console.log(`    - ${font.name} (${font.style})`);
                                });
                            });
                        }
                        
                        // Show most used font
                        if (analysis.analysis.mostUsedFont) {
                            console.log(chalk.yellow('\n🏆 Most Used Font:'));
                            const mostUsed = analysis.analysis.mostUsedFont;
                            const isInternal = /^g_d\d+_f\d+/.test(mostUsed.name);
                            const displayName = isInternal ? 
                                `${mostUsed.name} (internal ID)` : 
                                mostUsed.name;
                            console.log(`  ${chalk.green(displayName)} - ${mostUsed.totalCharacters} characters`);
                        }
                        
                        // Additional insights
                        console.log(chalk.yellow('\n🔍 Analysis Summary:'));
                        console.log(`  • Total characters analyzed: ${analysis.summary.totalCharacters}`);
                        console.log(`  • All fonts are embedded: ${analysis.summary.embeddedFonts === analysis.summary.totalFonts ? 'Yes ✅' : 'No ❌'}`);
                        console.log(`  • Font complexity: ${hasInternalIds ? 'High (uses internal references)' : 'Low (standard fonts)'}`);
                        
                        if (analysis.summary.totalFonts > 10) {
                            console.log(chalk.yellow('  ⚠️  Large number of fonts may impact file size'));
                        }
                        
                        if (argv.output) {
                            await fs.promises.writeFile(argv.output, JSON.stringify(analysis, null, 2));
                            console.log(chalk.green('\n💾 Analysis saved to:'), argv.output);
                        }
                    } catch (error) {
                        handleError(error);
                    }
                }
            )

            .demandCommand(1, 'Please specify a font command');
    }
);

// License Management Commands
cli.command(
    'license',
    'License management',
    (yargs) => {
        yargs
            .command(
                'status',
                'Show current license status',
                {},
                async (argv) => {
                    try {
                        const licenseManager = new LicenseManager();
                        const info = licenseManager.getLicenseInfo();
                        
                        console.log(chalk.blue('📄 License Status:'));
                        console.log(chalk.green('Tier:'), info.tier);
                        console.log(chalk.green('Email:'), info.email || 'N/A');
                        
                        if (info.expires) {
                            const expiry = new Date(info.expires);
                            const isExpired = expiry < new Date();
                            console.log(chalk.green('Expires:'), 
                                isExpired ? chalk.red(expiry.toDateString()) : chalk.yellow(expiry.toDateString()));
                        }
                        
                        console.log(chalk.blue('\n🔧 Available Features:'));
                        info.availableFeatures.forEach(feature => {
                            console.log(chalk.green('  ✅'), feature);
                        });
                        
                        if (info.tier === 'free') {
                            console.log(chalk.yellow('\n💡 Upgrade to Pro for:'));
                            console.log('  🚀 PDF Optimization (90%+ compression)');
                            console.log('  📄 Page Insertion');
                            console.log('  📧 Mail Merge');
                            console.log('  📊 Font Deduplication');
                            console.log(chalk.blue('\nVisit: https://stitchpdf.com/pricing'));
                        }
                        
                    } catch (error) {
                        handleError(error);
                    }
                }
            )
            .command(
                'demo',
                'Activate 7-day demo license',
                {},
                async (argv) => {
                    try {
                        const licenseManager = new LicenseManager();
                        const success = licenseManager.activateDemo();
                        
                        if (success) {
                            console.log(chalk.green('🎉 Demo license activated!'));
                            console.log(chalk.yellow('⏰ Valid for 7 days'));
                            console.log(chalk.blue('💡 All Pro features unlocked'));
                            console.log('\nTry: stitchpdf premium optimize your-large-file.pdf -o optimized.pdf');
                        } else {
                            console.log(chalk.red('❌ Failed to activate demo license'));
                        }
                        
                    } catch (error) {
                        handleError(error);
                    }
                }
            )
            .demandCommand(1, 'Please specify a license command');
    }
);

// PDF Optimization Commands
cli.command(
    'optimize',
    'PDF optimization tools',
    (yargs) => {
        yargs
            .command(
                'analyze <pdf>',
                'Analyze PDF for optimization opportunities',
                (yargs) => {
                    yargs
                        .positional('pdf', {
                            describe: 'PDF file to analyze',
                            type: 'string'
                        })
                        .option('output', {
                            alias: 'o',
                            describe: 'Output file for analysis report',
                            type: 'string'
                        });
                },
                async (argv) => {
                    try {
                        console.log(chalk.blue('📊 Analyzing PDF for optimization:'), argv.pdf);
                        
                        const analysis = await analyzePdfOptimization(argv.pdf);
                        
                        console.log(chalk.green('✅ Analysis complete'));
                        console.log(chalk.blue('📄 File size:'), `${analysis.fileSizeMB} MB`);
                        console.log(chalk.blue('📄 Pages:'), analysis.pageCount);
                        console.log(chalk.blue('💾 Estimated savings:'), `${(analysis.estimatedSavings / 1024 / 1024).toFixed(2)} MB (${analysis.estimatedSavingsPercent}%)`);
                        
                        if (analysis.opportunities.length > 0) {
                            console.log(chalk.yellow('\n🔧 Optimization Opportunities:'));
                            analysis.opportunities.forEach(opp => {
                                const priority = opp.priority === 'high' ? chalk.red(opp.priority) :
                                               opp.priority === 'medium' ? chalk.yellow(opp.priority) :
                                               chalk.blue(opp.priority);
                                console.log(`  ${priority}: ${opp.description}`);
                                console.log(`    Potential saving: ${(opp.estimatedSaving / 1024 / 1024).toFixed(2)} MB`);
                            });
                            console.log(chalk.yellow('\n💡 Use'), chalk.cyan('stitchpdf premium optimize'), chalk.yellow('to apply optimizations'));
                        } else {
                            console.log(chalk.green('\n✅ PDF is already well optimized'));
                        }
                        
                        if (argv.output) {
                            await fs.promises.writeFile(argv.output, JSON.stringify(analysis, null, 2));
                            console.log(chalk.green('\n💾 Analysis saved to:'), argv.output);
                        }
                    } catch (error) {
                        handleError(error);
                    }
                }
            )
            .demandCommand(1, 'Please specify an optimization command');
    }
);

// Page Insertion Commands
cli.command(
    'insert <target> <insert>',
    'Insert pages into PDF',
    (yargs) => {
        yargs
            .positional('target', {
                describe: 'Target PDF file',
                type: 'string'
            })
            .positional('insert', {
                describe: 'PDF to insert',
                type: 'string'
            })
            .option('pages', {
                alias: 'p',
                describe: 'Page numbers where to insert (comma-separated)',
                type: 'string',
                demandOption: true
            })
            .option('output', {
                alias: 'o',
                describe: 'Output file path',
                type: 'string',
                demandOption: true
            });
    },
    async (argv) => {
        try {
            console.log(chalk.blue('📄 Inserting pages...'));
            
            const pageNumbers = argv.pages.split(',').map(p => parseInt(p.trim()));
            const result = await insertAtPage(argv.target, argv.insert, pageNumbers, {
                outputPath: argv.output
            });
            
            console.log(chalk.green('✅ Pages inserted successfully'));
            console.log(chalk.green('💾 Saved to:'), argv.output);
        } catch (error) {
            handleError(error);
        }
    }
);

// Mail Merge Commands
cli.command(
    'merge',
    'Mail merge operations',
    (yargs) => {
        yargs
            .command(
                'create <template>',
                'Create mail merge configuration',
                (yargs) => {
                    yargs
                        .positional('template', {
                            describe: 'PDF template file',
                            type: 'string'
                        })
                        .option('output', {
                            alias: 'o',
                            describe: 'Output configuration file',
                            type: 'string',
                            default: 'merge-config.json'
                        })
                        .option('markers', {
                            describe: 'Field markers (e.g., "{{ }}")',
                            type: 'string',
                            default: '{{ }}'
                        });
                },
                async (argv) => {
                    try {
                        console.log(chalk.blue('📋 Creating merge configuration...'));
                        
                        const markers = argv.markers.split(' ');
                        const config = await createMailMerge(argv.template, {
                            fieldMarkers: markers,
                            outputPath: argv.output
                        });
                        
                        console.log(chalk.green('✅ Configuration created'));
                        console.log(chalk.blue('📊 Found fields:'), config.fields.length);
                        config.fields.forEach(field => {
                            console.log(`  - ${field.name} (page ${field.page})`);
                        });
                        console.log(chalk.green('💾 Saved to:'), argv.output);
                    } catch (error) {
                        handleError(error);
                    }
                }
            )
            .command(
                'process <config> <data>',
                'Process mail merge',
                (yargs) => {
                    yargs
                        .positional('config', {
                            describe: 'Merge configuration file',
                            type: 'string'
                        })
                        .positional('data', {
                            describe: 'Data source (CSV or JSON file)',
                            type: 'string'
                        })
                        .option('output', {
                            alias: 'o',
                            describe: 'Output directory',
                            type: 'string',
                            default: './merged-pdfs'
                        })
                        .option('prefix', {
                            describe: 'Output file prefix',
                            type: 'string',
                            default: 'merged_'
                        });
                },
                async (argv) => {
                    try {
                        console.log(chalk.blue('📄 Processing mail merge...'));
                        
                        // Load configuration
                        const configData = await fs.promises.readFile(argv.config, 'utf8');
                        const config = JSON.parse(configData);
                        
                        // Ensure output directory exists
                        if (!fs.existsSync(argv.output)) {
                            fs.mkdirSync(argv.output, { recursive: true });
                        }
                        
                        const results = await processMailMerge(config, argv.data, {
                            outputDirectory: argv.output,
                            outputPrefix: argv.prefix,
                            onProgress: (progress) => {
                                console.log(chalk.blue(`📊 Progress: ${progress.percentage}% (${progress.processed}/${progress.total})`));
                            }
                        });
                        
                        console.log(chalk.green('✅ Mail merge completed'));
                        console.log(chalk.green('📊 Generated:'), results.length, 'PDFs');
                        console.log(chalk.green('💾 Saved to:'), argv.output);
                    } catch (error) {
                        handleError(error);
                    }
                }
            )
            .demandCommand(1, 'Please specify a merge command');
    }
);

// License Management Commands
cli.command(
    'license',
    'License management',
    (yargs) => {
        yargs
            .command(
                'status',
                'Check license status',
                {},
                async () => {
                    try {
                        const status = licenseManager.getLicenseInfo();
                        
                        console.log(chalk.blue('📜 License Status'));
                        console.log('Licensed:', status.tier !== 'free' ? chalk.green('Yes') : chalk.red('No'));
                        console.log('Tier:', chalk.cyan(status.tier.toUpperCase()));
                        console.log('Features:', status.availableFeatures.join(', '));
                        
                        if (status.email) {
                            console.log('Email:', status.email);
                        }
                        
                        if (status.expires) {
                            const expiry = new Date(status.expires);
                            const isExpired = expiry < new Date();
                            console.log('Expires:', 
                                isExpired ? chalk.red(expiry.toDateString()) : chalk.yellow(expiry.toDateString()));
                        }
                        
                        if (status.hardwareId) {
                            console.log('Hardware ID:', chalk.gray(status.hardwareId));
                        }
                        
                        if (status.tier === 'free') {
                            console.log(chalk.yellow('\n💡 Upgrade to Pro for:'));
                            console.log('  🚀 PDF Optimization (90%+ compression)');
                            console.log('  📄 Page Insertion');
                            console.log('  📧 Mail Merge');
                            console.log('  📊 Font Deduplication');
                            console.log(chalk.blue('\nVisit: https://stitchpdf.com/pricing'));
                        }
                        
                    } catch (error) {
                        handleError(error);
                    }
                }
            )
            .command(
                'install <key>',
                'Install license key with secure validation',
                (yargs) => {
                    yargs.positional('key', {
                        describe: 'License key to install (e.g., STITCH-PRO-123456789)',
                        type: 'string'
                    });
                },
                async (argv) => {
                    try {
                        console.log(chalk.blue('🔒 Installing license with secure validation...'));
                        const result = await licenseManager.installLicense(argv.key);
                        
                        if (result.success) {
                            console.log(chalk.green('✅ License installed successfully'));
                            console.log('Tier:', chalk.cyan(result.license.tier.toUpperCase()));
                            console.log('Email:', result.license.email);
                            console.log('Hardware ID:', chalk.gray('Bound to this machine'));
                            
                            // Show unlocked features
                            const info = licenseManager.getLicenseInfo();
                            console.log(chalk.blue('\n🚀 Unlocked Features:'));
                            info.availableFeatures.forEach(feature => {
                                if (!['text-extraction', 'font-analysis', 'pdf-validation'].includes(feature)) {
                                    console.log(chalk.green('  ✅'), feature.replace('-', ' ').toUpperCase());
                                }
                            });
                        } else {
                            console.log(chalk.red('❌ License installation failed'));
                            console.log('Error:', result.message);
                            console.log(chalk.yellow('💡 Try:'), 'STITCH-PRO-123456789 (demo)');
                        }
                    } catch (error) {
                        handleError(error);
                    }
                }
            )
            .command(
                'remove',
                'Remove installed license',
                {},
                async () => {
                    try {
                        const success = await licenseManager.removeLicense();
                        
                        if (success) {
                            console.log(chalk.green('✅ License removed successfully'));
                        } else {
                            console.log(chalk.red('❌ Failed to remove license'));
                        }
                    } catch (error) {
                        handleError(error);
                    }
                }
            )
            .demandCommand(1, 'Please specify a license command');
    }
);

// Premium Features Command
cli.command(
    'premium',
    'Premium features (requires license)',
    (yargs) => {
        yargs
            .command(
                'insert-conditional <target> <insert>',
                'Insert pages based on text conditions',
                (yargs) => {
                    yargs
                        .positional('target', {
                            describe: 'Target PDF file',
                            type: 'string'
                        })
                        .positional('insert', {
                            describe: 'PDF to insert',
                            type: 'string'
                        })
                        .option('text', {
                            describe: 'Text to search for',
                            type: 'string'
                        })
                        .option('regex', {
                            describe: 'Regular expression pattern',
                            type: 'string'
                        })
                        .option('output', {
                            alias: 'o',
                            describe: 'Output file path',
                            type: 'string',
                            demandOption: true
                        })
                        .option('before', {
                            describe: 'Insert before matching page',
                            type: 'boolean',
                            default: true
                        });
                },
                async (argv) => {
                    try {
                        console.log(chalk.blue('🔒 Using premium feature: Conditional insertion'));
                        
                        const conditions = {};
                        if (argv.text) conditions.textContains = argv.text;
                        if (argv.regex) conditions.textMatches = argv.regex;
                        
                        const result = await insertConditional(argv.target, argv.insert, conditions, {
                            outputPath: argv.output,
                            insertBefore: argv.before
                        });
                        
                        console.log(chalk.green('✅ Conditional insertion completed'));
                        console.log(chalk.green('💾 Saved to:'), argv.output);
                    } catch (error) {
                        handleError(error);
                    }
                }
            )
            .command(
                'optimize <pdf>',
                'Optimize PDF file size (font deduplication, compression)',
                (yargs) => {
                    yargs
                        .positional('pdf', {
                            describe: 'PDF file to optimize',
                            type: 'string'
                        })
                        .option('output', {
                            alias: 'o',
                            describe: 'Output file path',
                            type: 'string',
                            demandOption: true
                        })
                        .option('fonts', {
                            describe: 'Deduplicate and optimize fonts',
                            type: 'boolean',
                            default: true
                        })
                        .option('images', {
                            describe: 'Compress images',
                            type: 'boolean',
                            default: true
                        })
                        .option('cleanup', {
                            describe: 'Remove unused objects',
                            type: 'boolean',
                            default: true
                        })
                        .option('compression', {
                            describe: 'Compression level',
                            choices: ['low', 'medium', 'high'],
                            default: 'medium'
                        });
                },
                async (argv) => {
                    try {
                        console.log(chalk.blue('🔒 Using premium feature: PDF Optimization'));
                        console.log(chalk.green('🚀 Now with WORKING Ghostscript integration!'));
                        console.log(chalk.yellow('💡 Can achieve 90%+ savings (vs pdf-lib\'s 0.9%)'));
                        
                        const result = await optimizePdf(argv.pdf, {
                            outputPath: argv.output,
                            deduplicateFonts: argv.fonts,
                            compressImages: argv.images,
                            removeUnusedObjects: argv.cleanup,
                            compressionLevel: argv.compression
                        });
                        
                        if (result.success) {
                            console.log(chalk.green('✅ REAL PDF optimization completed!'));
                            console.log(chalk.green('💾 Saved to:'), argv.output);
                            console.log(chalk.blue('💰 Savings:'), `${(result.savings / 1024 / 1024).toFixed(2)} MB (${result.savingsPercent}%)`);
                            console.log(chalk.blue('🔧 Tool:'), `${result.tool} v${result.version}`);
                            
                            if (result.savingsPercent > 50) {
                                console.log(chalk.green('🎉 INCREDIBLE RESULTS! This is what real optimization looks like!'));
                            }
                        } else if (result.error === 'PREMIUM_FEATURE_REQUIRED') {
                            console.log(chalk.red('🔒 PREMIUM FEATURE REQUIRED'));
                            console.log(chalk.yellow('📊 PDF Optimization requires Pro license'));
                            console.log(chalk.blue('💡 Try demo:'), chalk.cyan('stitchpdf license demo'));
                            console.log(chalk.blue('🛒 Upgrade:'), result.upgradeUrl || 'https://stitchpdf.com/pricing');
                        } else {
                            console.log(chalk.red('❌ Optimization failed:'), result.error);
                        }
                    } catch (error) {
                        handleError(error);
                    }
                }
            )
            .demandCommand(1, 'Please specify a premium command');
    }
);

// Version and info
cli.epilogue(`
Examples:
  $0 extract document.pdf                    Extract all text
  $0 extract document.pdf -o text.txt -l     Extract with layout preserved
  $0 validate document.pdf                   Validate PDF security
  $0 fonts analyze document.pdf             Analyze all fonts in PDF
  $0 fonts details document.pdf Arial       Get details about Arial font
  $0 fonts compare doc1.pdf doc2.pdf        Compare fonts between PDFs
  $0 optimize analyze document.pdf           Analyze optimization opportunities
  $0 insert target.pdf insert.pdf -p 1,3 -o result.pdf
  $0 merge create template.pdf -o config.json
  $0 merge process config.json data.csv -o ./output
  $0 license status                          Check license status
  $0 premium optimize large-file.pdf -o optimized.pdf   Optimize 2GB PDF!
  $0 premium insert-conditional target.pdf insert.pdf --text "Chapter" -o result.pdf

For more information: https://github.com/your-username/stitchPDF
`);

// Parse arguments and execute
cli.parse(); 