import { browserCaptureProspectExtractor } from './browserCaptureProspectExtractor';
import { socialGraphBuilder } from './socialGraphBuilder';
import { scoutScoreV4Engine } from './scoutScoreV4';

export interface IntelligencePipelineInput {
  userId: string;
  captureId?: string;
  textContent?: string;
  htmlSnapshot?: string;
  platform?: string;
  captureType?: string;
}

export interface IntelligencePipelineResult {
  success: boolean;
  prospects: any[];
  graphInsights: any;
  scoredProspects: any[];
  recommendations: string[];
  processingTimeMs: number;
}

class IntelligencePipeline {
  async processCapture(input: IntelligencePipelineInput): Promise<IntelligencePipelineResult> {
    const startTime = Date.now();

    try {
      const prospects = await this.extractProspects(input);

      const graphResult = await this.buildSocialGraph(input.userId, prospects);

      const scoredProspects = await this.scoreProspects(input.userId, prospects, graphResult);

      const processingTimeMs = Date.now() - startTime;

      return {
        success: true,
        prospects,
        graphInsights: graphResult,
        scoredProspects,
        recommendations: this.generateRecommendations(scoredProspects, graphResult),
        processingTimeMs,
      };
    } catch (error) {
      console.error('Intelligence pipeline error:', error);
      return {
        success: false,
        prospects: [],
        graphInsights: null,
        scoredProspects: [],
        recommendations: [],
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  private async extractProspects(input: IntelligencePipelineInput): Promise<any[]> {
    if (!input.textContent && !input.htmlSnapshot) {
      return [];
    }

    const extractionResult = await browserCaptureProspectExtractor.extractProspectsFromBrowserCapture(
      {
        textContent: input.textContent || '',
        htmlSnapshot: input.htmlSnapshot || '',
        platform: input.platform || 'unknown',
        captureType: input.captureType || 'generic',
      }
    );

    return extractionResult.prospects;
  }

  private async buildSocialGraph(userId: string, prospects: any[]): Promise<any> {
    try {
      const graphResult = await socialGraphBuilder.buildSocialGraph({
        userId,
        captureData: [{ prospects }],
        existingGraph: true,
      });

      return graphResult;
    } catch (error) {
      console.error('Social graph building error:', error);
      return null;
    }
  }

  private async scoreProspects(
    userId: string,
    prospects: any[],
    graphResult: any
  ): Promise<any[]> {
    const scoredProspects = [];

    for (const prospect of prospects) {
      try {
        const nodeId = `${prospect.platform || 'unknown'}_${prospect.fullName
          .toLowerCase()
          .replace(/\s+/g, '_')}`;

        const graphNode = graphResult?.nodes?.find((n: any) => n.id === nodeId);

        const scoreResult = await scoutScoreV4Engine.calculateScoutScoreV4({
          prospectId: nodeId,
          userId,
          textContent: prospect.rawTextSnippet,
          browserCaptureData: {
            opportunitySignals: prospect.opportunitySignals,
            painPointSignals: prospect.painPointSignals,
            mutualConnections: prospect.mutualConnections,
            lastSeen: prospect.timestamps?.[0],
            platform: prospect.platform,
          },
          socialGraphData: graphNode
            ? {
                centralityScore: graphNode.centralityScore,
                influenceScore: graphNode.influenceScore,
                clusterId: graphNode.clusterId,
                edgeWeight: 1.0,
              }
            : undefined,
        });

        scoredProspects.push({
          ...prospect,
          scoutScore: scoreResult.score,
          scoutRating: scoreResult.rating,
          scoutConfidence: scoreResult.confidence,
          scoutBreakdown: scoreResult.breakdown,
          scoutExplanation: scoreResult.explanation,
          scoutInsights: scoreResult.insights,
          scoutRecommendations: scoreResult.recommendations,
        });
      } catch (error) {
        console.error('Error scoring prospect:', error);
        scoredProspects.push({
          ...prospect,
          scoutScore: 50,
          scoutRating: 'warm',
          scoutConfidence: 0.3,
        });
      }
    }

    scoredProspects.sort((a, b) => b.scoutScore - a.scoutScore);

    return scoredProspects;
  }

  private generateRecommendations(scoredProspects: any[], graphResult: any): string[] {
    const recommendations: string[] = [];

    const hotProspects = scoredProspects.filter((p) => p.scoutRating === 'hot');
    if (hotProspects.length > 0) {
      recommendations.push(
        `${hotProspects.length} hot prospects identified - reach out immediately with personalized messages`
      );
    }

    const warmProspects = scoredProspects.filter((p) => p.scoutRating === 'warm');
    if (warmProspects.length > 0) {
      recommendations.push(
        `${warmProspects.length} warm prospects - nurture with value-first content before pitching`
      );
    }

    if (graphResult?.topInfluencers?.length > 0) {
      recommendations.push(
        `Focus on these influencers first: ${graphResult.topInfluencers.slice(0, 3).join(', ')}`
      );
    }

    if (graphResult?.opportunityClusters?.length > 0) {
      recommendations.push(
        `${graphResult.opportunityClusters.length} opportunity clusters detected - use community-based approach`
      );
    }

    const highOpportunityProspects = scoredProspects.filter(
      (p) => p.scoutBreakdown?.opportunity > 70
    );
    if (highOpportunityProspects.length > 0) {
      recommendations.push(
        `${highOpportunityProspects.length} prospects showing strong opportunity signals - prime for conversion`
      );
    }

    const painPointProspects = scoredProspects.filter((p) => p.scoutBreakdown?.painPoints > 60);
    if (painPointProspects.length > 0) {
      recommendations.push(
        `${painPointProspects.length} prospects with identified pain points - lead with solutions`
      );
    }

    return recommendations;
  }

  async getProspectScore(prospectId: string, userId: string): Promise<any> {
    try {
      const scoreResult = await scoutScoreV4Engine.calculateScoutScoreV4({
        prospectId,
        userId,
      });

      return scoreResult;
    } catch (error) {
      console.error('Error getting prospect score:', error);
      return null;
    }
  }

  async updateGraphFromCapture(userId: string, captureData: any): Promise<boolean> {
    try {
      const graphResult = await socialGraphBuilder.buildSocialGraph({
        userId,
        captureData: [captureData],
        existingGraph: true,
      });

      return graphResult.success;
    } catch (error) {
      console.error('Error updating graph:', error);
      return false;
    }
  }
}

export const intelligencePipeline = new IntelligencePipeline();
